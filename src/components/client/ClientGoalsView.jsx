// src/components/client/ClientGoalsView.jsx
import React from 'react';
import { Target, CheckCircle, TrendingUp } from 'lucide-react';

const ClientGoalsView = ({ userProfile, clients }) => {
  const clientData = clients.find(c => c.email === userProfile.email) || clients[0];

  if (!clientData) {
    return (
      <div className="text-center py-8">
        <p className="text-[#9B97A2]">No client data found. Please contact your coach.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#292929]">My Goals & Progress</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
          <Target className="mr-2 text-[#6D858E]" size={20} />
          Current Goals
        </h3>
        <div className="bg-[#BED2D8] p-4 rounded-lg border-l-4 border-[#6D858E]">
          <p className="text-[#292929]">
            {clientData.currentGoals || 'Work with your coach to set specific business goals for your success!'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-[#6D858E] flex items-center">
            <CheckCircle className="mr-2" size={20} />
            My Strengths
          </h3>
          <div className="text-[#292929] bg-[#BED2D8] p-4 rounded-lg border-l-4 border-[#6D858E]">
            {clientData.strengths ? (
              <ul className="space-y-2">
                {clientData.strengths.split(', ').map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-[#6D858E] mr-2">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#9B97A2]">Your coach will help identify your strengths!</p>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-[#6D858E] flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Progress Tracking
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#707070]">Overall Business Progress</span>
                <span className="font-semibold text-[#292929]">{clientData.progress || 0}%</span>
              </div>
              <div className="w-full bg-[#F5F5F5] rounded-full h-4">
                <div 
                  className="bg-[#6D858E] h-4 rounded-full transition-all duration-500" 
                  style={{width: `${clientData.progress || 0}%`}}
                ></div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-[#BED2D8] rounded">
              <p className="text-sm text-[#292929]">
                Great progress! Keep working toward your goals with your coach's guidance.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-[#292929]">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-[#292929] mb-2">Business Details</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-[#707070]">Business Name:</span>
                <p className="font-medium text-[#6D858E]">{clientData.businessName}</p>
              </div>
              <div>
                <span className="text-sm text-[#707070]">Business Type:</span>
                <p className="font-medium text-[#292929]">{clientData.jobGoal}</p>
              </div>
              <div>
                <span className="text-sm text-[#707070]">Equipment:</span>
                <p className="font-medium text-[#292929]">{clientData.equipment}</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-[#292929] mb-2">Description</h4>
            <p className="text-[#707070] bg-[#F5F5F5] p-3 rounded">
              {clientData.businessDescription || 'Work with your coach to develop your business description.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientGoalsView;