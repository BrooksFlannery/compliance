'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/trpc';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function RulesPage() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId');
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  
  const { data: allRules, isLoading: rulesLoading } = api.rules.getAllRules.useQuery();
  const { data: businessRules, isLoading: businessRulesLoading } = api.business.getBusinessRules.useQuery(
    { businessId: businessId! },
    { enabled: !!businessId }
  );
  const { data: selectedBusiness } = api.business.getBusiness.useQuery(
    { id: businessId! },
    { enabled: !!businessId }
  );
  // Remove automatic seeding - we now have real data files
  // const seedMutation = api.rules.seedMockData.useMutation();

  // useEffect(() => {
  //   if (allRules && allRules.length === 0) {
  //     seedMutation.mutate();
  //   }
  // }, [allRules, seedMutation]);

  // Use business-specific rules if businessId is provided, otherwise use all rules
  const rules = businessId ? businessRules : allRules;
  const isLoading = businessId ? businessRulesLoading : rulesLoading;

  // Debug information
  console.log('Rules page debug:', {
    businessId,
    allRulesCount: allRules?.length || 0,
    businessRulesCount: businessRules?.length || 0,
    rulesCount: rules?.length || 0,
    isLoading
  });

  // Get unique categories from rules
  const categories = rules ? 
    Array.from(new Set(rules.flatMap((rule: any) => rule.categories))).sort() : 
    [];

  // Filter rules based on search term and category
  const filteredRules = rules?.filter((rule: any) => {
    const matchesSearch = searchTerm === '' || 
      rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.shortDescription && rule.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      rule.categories.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Helper function to format criteria for display
  const formatCriteria = (criteriaGroups: any[]) => {
    if (!criteriaGroups || criteriaGroups.length === 0) {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>No criteria specified</span>;
    }

    return criteriaGroups.map((group, groupIndex) => (
      <div key={group.id || groupIndex} style={{ marginBottom: '10px' }}>
        <div style={{ 
          fontWeight: 'bold', 
          color: '#666', 
          fontSize: '12px',
          marginBottom: '5px'
        }}>
          Group {groupIndex + 1} ({group.operator})
        </div>
        <div style={{ marginLeft: '10px' }}>
          {group.criteria.map((criterion: any, criterionIndex: number) => (
            <div key={criterion.id || criterionIndex} style={{ 
              fontSize: '11px', 
              color: '#333',
              marginBottom: '3px',
              fontFamily: 'monospace'
            }}>
              {criterion.key} {criterion.operator} {JSON.stringify(criterion.value)}
            </div>
          ))}
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading rules...</div>;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      position: 'relative'
    }}>
      {/* Debug Button */}
      <button
        onClick={() => setShowDebugInfo(!showDebugInfo)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '8px 12px',
          backgroundColor: showDebugInfo ? '#dc3545' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
      </button>

      {/* Header */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #ddd',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            {selectedBusiness ? `${selectedBusiness.name} - Applicable Rules` : 'Business Rules'}
          </h1>
          <Link 
            href="/business" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Back to Businesses
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
              Search Rules
            </label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ 
          marginBottom: '20px',
          color: '#666',
          fontSize: '14px'
        }}>
          {businessId ? (
            <div>
              <div>Showing {filteredRules.length} of {rules?.length || 0} applicable rules</div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                Out of {allRules?.length || 0} total rules in the system
              </div>
            </div>
          ) : (
            <div>Showing {filteredRules.length} of {rules?.length || 0} rules</div>
          )}
        </div>
      </div>

      {/* Rules List */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '0 20px 20px 20px'
      }}>
        {filteredRules.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <p style={{ margin: 0, color: '#666' }}>
              {searchTerm || selectedCategory !== 'all' 
                ? 'No rules match your current filters.' 
                : 'No rules available.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredRules.map((rule) => (
              <div key={rule.id} style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {rule.title}
                </h3>
                
                {rule.shortDescription && (
                  <p style={{ 
                    margin: '0 0 15px 0', 
                    color: '#666',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {rule.shortDescription}
                  </p>
                )}

                {/* Debug Info */}
                {showDebugInfo && (
                  <div style={{
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    borderLeft: '4px solid #007bff'
                  }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: '#007bff', 
                      fontSize: '12px',
                      marginBottom: '8px'
                    }}>
                      📋 Inclusion Criteria:
                    </div>
                    {formatCriteria(rule.criteriaGroups)}
                  </div>
                )}

                {/* Categories */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px' 
                  }}>
                    {rule.categories.map((category) => (
                      <span key={category} style={{
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                <div style={{ 
                  display: 'flex', 
                  gap: '20px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  {rule.jurisdiction && (
                    <span>
                      <strong>Jurisdiction:</strong> {rule.jurisdiction}
                    </span>
                  )}
                  {rule.source && (
                    <span>
                      <strong>Source:</strong> {rule.source}
                    </span>
                  )}
                  {rule.effectiveDate && (
                    <span>
                      <strong>Effective:</strong> {new Date(rule.effectiveDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 