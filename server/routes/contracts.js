import { Router } from 'express';
import {
  createContract,
  findContractById,
  findContractsByTransaction,
  updateContract,
} from '../models/Contract.js';
import { findTransactionById } from '../models/Transaction.js';
import { findDealById } from '../models/Deal.js';
import { findUserById } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// Contract templates (hardcoded)
// ---------------------------------------------------------------------------
const CONTRACT_TEMPLATES = [
  {
    id: 'tpl-assignment-v1',
    name: 'Assignment Contract',
    type: 'assignment',
    description: 'Standard assignment of contract agreement for wholesale transactions. Transfers the assignor\'s rights under the original purchase agreement to the assignee for an assignment fee.',
    sections: ['Parties', 'Property Description', 'Assignment Fee', 'Closing Terms', 'Representations', 'Signatures'],
  },
  {
    id: 'tpl-purchase-v1',
    name: 'Purchase Agreement',
    type: 'purchase',
    description: 'Standard real estate purchase agreement between buyer and seller. Includes contingency clauses, inspection period, and financing terms.',
    sections: ['Parties', 'Property Description', 'Purchase Price', 'Earnest Money', 'Contingencies', 'Inspection Period', 'Closing Terms', 'Signatures'],
  },
  {
    id: 'tpl-jv-v1',
    name: 'Joint Venture Agreement',
    type: 'joint_venture',
    description: 'Joint venture agreement for partnering on a real estate deal. Defines capital contributions, profit splits, roles, and exit strategy.',
    sections: ['Parties', 'Property Description', 'Capital Contributions', 'Profit Split', 'Management Roles', 'Exit Strategy', 'Dispute Resolution', 'Signatures'],
  },
];

// ---------------------------------------------------------------------------
// GET /api/contracts/templates — List available contract templates
// ---------------------------------------------------------------------------
router.get('/templates', (req, res) => {
  res.json({ templates: CONTRACT_TEMPLATES });
});

// ---------------------------------------------------------------------------
// GET /api/contracts/:id — Get a single contract
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const contract = await findContractById(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    // Verify the user is a party to the contract's transaction
    const txn = await findTransactionById(contract.transactionId);
    if (!txn) return res.status(404).json({ error: 'Associated transaction not found' });

    const isParty = txn.wholesalerId === req.user.id || txn.investorId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isParty && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ contract });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contract: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/contracts — Create a contract for a transaction
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { transactionId, templateId, type } = req.body;

    if (!transactionId) return res.status(400).json({ error: '"transactionId" is required' });
    if (!templateId) return res.status(400).json({ error: '"templateId" is required' });

    // Validate template exists
    const template = CONTRACT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return res.status(400).json({ error: 'Invalid templateId' });

    // Validate transaction exists
    const txn = await findTransactionById(transactionId);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    // Only parties or admins can create contracts
    const isParty = txn.wholesalerId === req.user.id || txn.investorId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isParty && !isAdmin) {
      return res.status(403).json({ error: 'Only transaction parties can create contracts' });
    }

    // Fetch deal and party details for auto-populating the contract
    const deal = await findDealById(txn.dealId);
    const wholesaler = await findUserById(txn.wholesalerId);
    const investor = await findUserById(txn.investorId);

    const contractType = type || template.type;

    // Auto-populate parties from the transaction
    const parties = [
      {
        userId: txn.wholesalerId,
        name: wholesaler?.name || 'Unknown',
        role: contractType === 'assignment' ? 'assignor' : 'seller',
        signedAt: null,
      },
      {
        userId: txn.investorId,
        name: investor?.name || 'Unknown',
        role: contractType === 'assignment' ? 'assignee' : 'buyer',
        signedAt: null,
      },
    ];

    // Generate document content from template
    const propertyAddress = deal
      ? `${deal.address}, ${deal.city}, ${deal.state} ${deal.zip || ''}`
      : 'Property address pending';

    const documentContent = [
      `${template.name.toUpperCase()}`,
      ``,
      `Template: ${template.name}`,
      `Date: ${new Date().toISOString().split('T')[0]}`,
      ``,
      `PROPERTY: ${propertyAddress}`,
      ``,
      `PARTY 1 (${parties[0].role}): ${parties[0].name}`,
      `PARTY 2 (${parties[1].role}): ${parties[1].name}`,
      ``,
      `Sale Price: $${txn.salePrice?.toLocaleString()}`,
      `Platform Fee: $${txn.platformFee?.toLocaleString()}`,
      ``,
      `Sections: ${template.sections.join(', ')}`,
      ``,
      `[Full contract terms would appear here in production]`,
    ].join('\n');

    const contract = await createContract({
      transactionId: txn.id,
      templateId,
      type: contractType,
      status: 'draft',
      parties,
      documentContent,
    });

    res.status(201).json({ contract });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create contract: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/contracts/:id/sign — Sign a contract
// ---------------------------------------------------------------------------
router.put('/:id/sign', async (req, res) => {
  try {
    const contract = await findContractById(req.params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    if (contract.status === 'fully_signed') {
      return res.status(400).json({ error: 'Contract is already fully signed' });
    }

    // Find the current user's party entry
    const partyIndex = contract.parties.findIndex(p => p.userId === req.user.id);
    if (partyIndex === -1) {
      return res.status(403).json({ error: 'You are not a party to this contract' });
    }

    if (contract.parties[partyIndex].signedAt) {
      return res.status(400).json({ error: 'You have already signed this contract' });
    }

    // Sign the contract
    const updatedParties = [...contract.parties];
    updatedParties[partyIndex] = {
      ...updatedParties[partyIndex],
      signedAt: new Date().toISOString(),
    };

    // Determine new status based on how many parties have signed
    const signedCount = updatedParties.filter(p => p.signedAt !== null).length;
    let newStatus;
    if (signedCount >= updatedParties.length) {
      newStatus = 'fully_signed';
    } else if (signedCount > 0) {
      newStatus = 'signed_by_one';
    } else {
      newStatus = contract.status;
    }

    const updated = await updateContract(contract.id, {
      parties: updatedParties,
      status: newStatus,
    });

    res.json({ contract: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sign contract: ' + err.message });
  }
});

export default router;
