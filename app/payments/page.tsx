'use client';

import React from 'react';
import { PaymentManagementInterface } from '@/components/payments';

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <PaymentManagementInterface 
          userRole="client" // Can be 'client', 'developer', or 'admin'
          className="w-full"
        />
      </div>
    </div>
  );
}