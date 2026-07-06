import { Brain, Clock, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { MDProfile } from '../types';

export default function Memory({ knowledge, profile }: { knowledge: any[], profile: MDProfile }) {
  const sortedKnowledge = (knowledge || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    if (!knowledge || knowledge.length === 0) return;
    setLoadingInsights(true);
    setError(null);
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledge, apiKey: profile.geminiApiKey })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setInsights(data.insights);
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights.');
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold mb-1 flex items-center">
            <Brain className="mr-2 text-executive-gold" size={24} /> Long-Term Memory & Insights
          </h2>
          <p className="text-slate-500 text-sm">Strategic facts and business context I've learned about you</p>
        </div>
        <button 
          onClick={generateInsights}
          disabled={loadingInsights || sortedKnowledge.length === 0}
          className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingInsights ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2 text-executive-gold" />}
          Generate Strategic Insights
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {insights && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-6 rounded-3xl shadow-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-executive-gold flex items-center mb-4">
            <Sparkles className="mr-2" size={20} /> Business Insights Dashboard
          </h3>
          <div className="markdown-body prose prose-invert max-w-none text-sm">
            <Markdown>{insights}</Markdown>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {sortedKnowledge.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
            <p className="text-slate-500 text-sm">My knowledge base is empty.</p>
            <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto">
              Tell me about your business models, strategies, or personal preferences, and say "remember that" so I can store it permanently.
            </p>
          </div>
        ) : (
          sortedKnowledge.map(fact => (
            <div key={fact.id} className="bg-white shadow-sm border border-slate-200 p-5 rounded-2xl flex items-start gap-4">
              <div className="bg-slate-50 p-2 rounded-xl text-slate-400 shrink-0 mt-1">
                <Brain size={20} />
              </div>
              <div>
                <p className="text-slate-800 font-medium leading-relaxed">{fact.fact}</p>
                <div className="flex items-center text-xs text-slate-400 mt-3">
                  <Clock size={12} className="mr-1" />
                  {new Date(fact.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
