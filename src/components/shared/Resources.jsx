// src/components/shared/Resources.jsx
import React from 'react';
import { BookOpen, FileText } from 'lucide-react';
import { RESOURCE_CATEGORIES, EQUIPMENT_BUSINESS_REFERENCE } from '../../utils/constants';

const Resources = ({ userRole }) => {
  const isClient = userRole === 'client';
  const resources = isClient ? RESOURCE_CATEGORIES.CLIENT : RESOURCE_CATEGORIES.STAFF;
  
  const title = isClient ? 'Business Resources' : 'ITG Coaching Resources';
  const subtitle = isClient 
    ? 'Tools and guides to help your business succeed' 
    : 'Supporting entrepreneurial success for adults with disabilities';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-[#BED2D8]">{subtitle}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(resources).map(([category, resourceList]) => (
          <div key={category} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
              <BookOpen className="mr-2 text-[#6D858E]" size={20} />
              {category}
            </h3>
            <ul className="space-y-2">
              {resourceList.map((resource, index) => (
                <li key={index} className="flex items-start space-x-2 hover:bg-[#F5F5F5] p-2 rounded cursor-pointer">
                  <FileText className="text-[#707070] mt-1 flex-shrink-0" size={16} />
                  <span className="text-sm text-[#292929]">{resource}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Equipment Reference - only show for staff */}
      {!isClient && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-[#292929]">
            Equipment & Business Type Quick Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(EQUIPMENT_BUSINESS_REFERENCE).map(([businessType, details]) => (
              <div key={businessType}>
                <h4 className="font-semibold text-[#6D858E] mb-2">{businessType}</h4>
                <ul className="text-sm space-y-1 text-[#292929]">
                  {details.map((detail, index) => (
                    <li key={index}>• {detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;