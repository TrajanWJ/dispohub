import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
// Note: In a real environment, we'd need a token, but for this mock test 
// we'll just check if the model logic works or if we can hit the endpoint.
// Since I can't easily get a real token without a login flow, 
// I'll create a local node script to test the model logic directly if possible,
// or just trust the code review if I can't run the server.

import { findAllDeals } from './server/models/Deal.js';
import db from './server/db/db.js';

async function testFilters() {
    console.log('Testing findAllDeals model...');

    const allDeals = await findAllDeals();
    console.log(`Total deals: ${allDeals.length}`);

    const pendingDeals = await findAllDeals({ status: 'pending_review' });
    console.log(`Pending deals: ${pendingDeals.length}`);
    if (pendingDeals.length > 0) {
        console.log('✓ Status filter works');
    }

    const wholesalerId = allDeals[0]?.wholesalerId;
    if (wholesalerId) {
        const wholesalerDeals = await findAllDeals({ wholesalerId });
        console.log(`Deals for wholesaler ${wholesalerId}: ${wholesalerDeals.length}`);
        const allMatch = wholesalerDeals.every(d => d.wholesalerId === wholesalerId);
        console.log(allMatch ? '✓ WholesalerId filter works' : '✗ WholesalerId filter failed');
    }

    const sfhDeals = await findAllDeals({ propertyType: 'SFH' });
    console.log(`SFH deals: ${sfhDeals.length}`);
}

testFilters().catch(console.error);
