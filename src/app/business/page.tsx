'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/trpc';
import Link from 'next/link';

export default function BusinessPage() {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  
  const { data: businesses, isLoading: businessesLoading } = api.business.getAllBusinesses.useQuery();
  const { data: selectedBusiness, isLoading: businessLoading } = api.business.getBusiness.useQuery(
    { id: selectedBusinessId! },
    { enabled: !!selectedBusinessId }
  );
  // Remove automatic seeding - we now have real data files
  // const seedMutation = api.business.seedMockData.useMutation();

  // useEffect(() => {
  //   if (businesses && businesses.length > 0 && !selectedBusinessId) {
  //     setSelectedBusinessId(businesses[0].id);
  //   } else if (businesses && businesses.length === 0) {
  //     seedMutation.mutate();
  //   }
  // }, [businesses, selectedBusinessId, seedMutation]);

  // Auto-select first business when data loads
  useEffect(() => {
    if (businesses && businesses.length > 0 && !selectedBusinessId) {
      setSelectedBusinessId(businesses[0].id);
    }
  }, [businesses, selectedBusinessId]);

  if (businessesLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading businesses...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '300px', 
        backgroundColor: '#f5f5f5', 
        borderRight: '1px solid #ddd',
        padding: '20px',
        overflowY: 'auto'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
          Select Business
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {businesses?.map((business: any) => (
            <button
              key={business.id}
              onClick={() => setSelectedBusinessId(business.id)}
              style={{
                padding: '12px',
                textAlign: 'left',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: selectedBusinessId === business.id ? '#e3f2fd' : 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {business.name}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {business.industry?.name || 'Unknown Industry'}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
          <Link 
            href={`/rules?businessId=${selectedBusinessId || ''}`}
            style={{
              display: 'block',
              padding: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '14px'
            }}
          >
            View Applicable Rules
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {selectedBusiness ? (
          <div>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 'bold' }}>
              {selectedBusiness.name}
            </h1>

            {/* Business Information Form */}
            <div style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Business Name
                </label>
                <input
                  type="text"
                  value={selectedBusiness.name}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Industry
                </label>
                <input
                  type="text"
                  value={selectedBusiness.industry?.name || 'Not specified'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Locations
                </label>
                <input
                  type="text"
                  value={selectedBusiness.locations.map(loc => loc.fullName || `${loc.city}, ${loc.state || loc.province}, ${loc.country}`).join(', ')}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Annual Revenue
                </label>
                <input
                  type="text"
                  value={selectedBusiness.revenue ? 
                    `${selectedBusiness.revenue.currency} ${selectedBusiness.revenue.amount.toLocaleString()}` : 
                    'Not specified'
                  }
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Number of Employees
                </label>
                <input
                  type="text"
                  value={selectedBusiness.size?.numEmployees?.toLocaleString() || 'Not specified'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Business Type
                </label>
                <input
                  type="text"
                  value={selectedBusiness.type?.businessType || 'Not specified'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              {/* Business Attributes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Business Attributes
                </label>
                <div style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {selectedBusiness.attributes ? 
                    Object.entries(selectedBusiness.attributes)
                      .map(([key, value]) => (
                        <div key={key} style={{ marginBottom: '5px' }}>
                          <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : JSON.stringify(value)}
                        </div>
                      ))
                    : 'No attributes specified'
                  }
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Select a business from the sidebar to view details</p>
          </div>
        )}
      </div>
    </div>
  );
} 