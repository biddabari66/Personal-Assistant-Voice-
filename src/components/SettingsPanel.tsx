import { useState } from 'react';
import { MDProfile } from '../types';
import { User, Building, Key, Save, Lock, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SettingsPanel({ profile, saveProfile }: { profile: MDProfile, saveProfile: (p: MDProfile) => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    saveProfile({
      name: formData.get('name') as string,
      companyName: formData.get('companyName') as string,
      salutation: formData.get('salutation') as string,
      geminiApiKey: formData.get('geminiApiKey') as string,
    });
    alert("Settings saved successfully.");
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg({ text: error.message, type: 'error' });
    } else {
      setPasswordMsg({ text: 'Password updated successfully', type: 'success' });
      setNewPassword('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Executive Settings</h2>
          <p className="text-slate-500 text-sm">Configure the assistant's preferences and brain</p>
        </div>
        <button onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-700 bg-red-50 px-4 py-2 rounded-xl transition-colors font-medium">
          <LogOut size={16} className="mr-2" /> Sign Out
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm rounded-3xl p-6 border border-slate-200 space-y-6">
          <h3 className="text-executive-gold font-semibold text-lg flex items-center border-b border-slate-200 pb-4">
            <User className="mr-2" size={20} /> Identity
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Your Name</label>
              <input 
                name="name" 
                defaultValue={profile.name} 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-executive-gold transition-colors" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Preferred Salutation</label>
              <select 
                name="salutation" 
                defaultValue={profile.salutation} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-executive-gold transition-colors appearance-none"
              >
                <option value="Sir">Sir</option>
                <option value="Ma'am">Ma'am</option>
                <option value="">No Salutation</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-3xl p-6 border border-slate-200 space-y-6">
          <h3 className="text-executive-gold font-semibold text-lg flex items-center border-b border-slate-200 pb-4">
            <Building className="mr-2" size={20} /> Organization
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Company Group Name</label>
            <input 
              name="companyName" 
              defaultValue={profile.companyName} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-executive-gold transition-colors" 
            />
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-3xl p-6 border border-slate-200 space-y-6">
          <h3 className="text-executive-gold font-semibold text-lg flex items-center border-b border-slate-200 pb-4">
            <Key className="mr-2" size={20} /> AI Brain (Gemini API)
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Gemini API Key</label>
            <input 
              name="geminiApiKey" 
              type="password"
              defaultValue={profile.geminiApiKey} 
              placeholder="AI Studio API Key"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-executive-gold transition-colors font-mono" 
            />
            <p className="text-xs text-slate-500 mt-2">Required for the assistant to process natural language intents.</p>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-3xl p-6 border border-slate-200 space-y-6">
          <h3 className="text-executive-gold font-semibold text-lg flex items-center border-b border-slate-200 pb-4">
            <Lock className="mr-2" size={20} /> Security & Account
          </h3>
          
          <div className="space-y-4">
            {passwordMsg.text && (
              <div className={`p-3 rounded-xl text-sm font-medium ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {passwordMsg.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Change Password</label>
              <div className="flex space-x-2">
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-executive-gold transition-colors" 
                />
                <button 
                  type="button" 
                  onClick={handlePasswordChange}
                  className="bg-slate-900 text-white font-medium px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-executive-gold text-slate-900 font-bold text-lg py-4 rounded-xl flex items-center justify-center hover:bg-executive-gold/90 transition-colors shadow-lg">
          <Save className="mr-2" size={20} />
          Save Preferences
        </button>
      </form>
    </div>
  );
}
