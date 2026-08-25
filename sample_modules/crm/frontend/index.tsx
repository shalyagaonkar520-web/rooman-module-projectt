import React, { useState } from 'react';

export const CRMView: React.FC = () => {
  const [contacts] = useState([
    { id: '1', name: 'Acme Corp', contact: 'Alice Smith', email: 'alice@acme.com', status: 'Lead', dealValue: '$12,500' },
    { id: '2', name: 'Stark Ind', contact: 'Tony Stark', email: 'tony@stark.com', status: 'Closed-Won', dealValue: '$85,000' },
  ]);

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl border border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-indigo-400">CRM Dashboard</h2>
          <p className="text-slate-400 text-sm">Manage contacts, leads, and sales deals</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium text-sm transition">
          + Add Contact
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800 text-slate-400">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">Primary Contact</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Deal Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {contacts.map(c => (
              <tr key={c.id} className="hover:bg-slate-800/50">
                <td className="p-3 font-semibold text-white">{c.name}</td>
                <td className="p-3">{c.contact}</td>
                <td className="p-3 text-indigo-400">{c.email}</td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs">
                    {c.status}
                  </span>
                </td>
                <td className="p-3 font-mono">{c.dealValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
