// Express router for CRM module
import { Router } from 'express';

export const crmRouter = Router();

crmRouter.get('/contacts', (req, res) => {
  res.json([
    { id: '1', name: 'Acme Corp', contact: 'Alice Smith', email: 'alice@acme.com', status: 'Lead', dealValue: 12500 },
    { id: '2', name: 'Stark Ind', contact: 'Tony Stark', email: 'tony@stark.com', status: 'Closed-Won', dealValue: 85000 }
  ]);
});

crmRouter.post('/contacts', (req, res) => {
  const newContact = req.body;
  res.status(201).json({ message: 'Contact created', contact: { id: Date.now().toString(), ...newContact } });
});
