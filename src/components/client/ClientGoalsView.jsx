// src/components/client/ClientGoalsView.jsx - Updated to simplify Grace clients, not Bridges
import React from 'react';
import { Target, TrendingUp, User } from 'lucide-react';

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
            {clientData.currentGoals || `Work with your coach to set specific ${
              clientData.program === 'grace' ? 'enrichment program goals' :
              clientData.program === 'bridges' ? 'career development goals' :
              clientData.program === 'limitless' ? 'business goals' :
              'program goals'
            } for your success!`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Only show progress tracking for non-Grace clients */}
        {clientData.program !== 'grace' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-[#6D858E] flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Progress Tracking
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#707070]">
                    {clientData.program === 'limitless' ? 'Overall Business Progress' :
                     clientData.program === 'bridges' ? 'Career Development Progress' :
                     'Overall Progress'}
                  </span>
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
        )}

        {/* Motivational section - different content based on program */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-[#6D858E] flex items-center">
            <User className="mr-2" size={20} />
            {clientData.program === 'grace' ? 'Grace Program Journey' :
             clientData.program === 'bridges' ? 'Career Development Journey' : 
             'Your Development'}
          </h3>
          <div className="space-y-4">
            {clientData.program === 'grace' ? (
              <div className="p-3 bg-[#BED2D8] rounded border-l-4 border-[#9B97A2]">
                <h4 className="font-semibold text-[#292929] mb-2">Grace Program Focus</h4>
                <ul className="text-sm text-[#292929] space-y-1">
                  <li>• Participate in enriching activities</li>
                  <li>• Build social connections</li>
                  <li>• Develop personal interests</li>
                  <li>• Enjoy meaningful experiences</li>
                </ul>
              </div>
            ) : clientData.program === 'bridges' ? (
              <div className="p-3 bg-[#BED2D8] rounded border-l-4 border-[#5A4E69]">
                <h4 className="font-semibold text-[#292929] mb-2">Bridges Program Focus</h4>
                <ul className="text-sm text-[#292929] space-y-1">
                  <li>• Build workplace skills and confidence</li>
                  <li>• Complete internship experiences</li>
                  <li>• Develop professional relationships</li>
                  <li>• Prepare for career success</li>
                </ul>
              </div>
            ) : (
              <div className="p-3 bg-[#BED2D8] rounded">
                <p className="text-sm text-[#292929]">
                  Keep working toward your goals with your coach's guidance. Every step forward is progress!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Program-specific information section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-[#292929]">
          {clientData.program === 'grace' ? 'Grace Program Information' :
           clientData.program === 'bridges' ? 'Career Development Information' :
           clientData.program === 'limitless' ? 'Business Information' :
           clientData.program === 'new-options' ? 'Job Information' :
           'Program Information'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-[#292929] mb-2">
              {clientData.program === 'grace' ? 'Program Details' :
               clientData.program === 'bridges' ? 'Career Details' :
               clientData.program === 'limitless' ? 'Business Details' :
               'Program Details'}
            </h4>
            <div className="space-y-2">
              {clientData.program === 'grace' ? (
                <>
                  {clientData.jobGoal && (
                    <div>
                      <span className="text-sm text-[#707070]">Enrichment Activities:</span>
                      <p className="font-medium text-[#6D858E]">{clientData.jobGoal}</p>
                    </div>
                  )}
                </>
              ) : clientData.program === 'bridges' ? (
                <>
                  <div>
                    <span className="text-sm text-[#707070]">Career Goals:</span>
                    <p className="font-medium text-[#6D858E]">{clientData.jobGoal}</p>
                  </div>
                </>
              ) : clientData.program === 'limitless' ? (
                <>
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
                </>
              ) : clientData.program === 'new-options' ? (
                <>
                  <div>
                    <span className="text-sm text-[#707070]">Job Interest:</span>
                    <p className="font-medium text-[#6D858E]">{clientData.jobGoal}</p>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-sm text-[#707070]">Program:</span>
                  <p className="font-medium text-[#292929]">{clientData.program || 'Limitless'}</p>
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-[#292929] mb-2">Description</h4>
            <p className="text-[#707070] bg-[#F5F5F5] p-3 rounded">
              {clientData.businessDescription || `Work with your coach to develop your ${
                clientData.program === 'grace' ? 'enrichment program goals' :
                clientData.program === 'bridges' ? 'career development plan' :
                clientData.program === 'limitless' ? 'business description' :
                'program description'
              }.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientGoalsView;