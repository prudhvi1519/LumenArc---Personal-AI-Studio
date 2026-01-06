
import React from 'react';
// FIX: Renamed imported 'Settings' type to 'SettingsType' to avoid a name collision with the `Settings` component.
import { Settings as SettingsType } from '../types';
import { MenuIcon } from './icons';

interface SettingsProps {
    settings: SettingsType;
    onSettingsChange: (newSettings: Partial<SettingsType>) => void;
    onToggleSidebar: () => void;
}

const Toggle: React.FC<{ label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-200">
        <div>
            <h3 className="font-medium text-gray-800">{label}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
        </label>
    </div>
);


export const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange, onToggleSidebar }) => {
    return (
        <div className="flex flex-col h-full bg-[#F9FAFB]">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 z-10 bg-white/80 backdrop-blur-sm">
                <button onClick={onToggleSidebar} className="p-2 md:hidden mr-2">
                    <MenuIcon className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold">Settings</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">Chat Defaults</h2>
                    <Toggle 
                        label="Web Search"
                        description="Enable web search by default for new chats."
                        checked={settings.webSearchDefault}
                        onChange={(val) => onSettingsChange({ webSearchDefault: val })}
                    />
                    <Toggle 
                        label="Thinking Mode"
                        description="Use Gemini Pro for more complex reasoning by default."
                        checked={settings.thinkingModeDefault}
                        onChange={(val) => onSettingsChange({ thinkingModeDefault: val })}
                    />
                    
                    <div className="py-4 border-b border-gray-200">
                         <div className="flex items-center justify-between">
                             <div>
                                 <h3 className="font-medium text-gray-800">Temperature</h3>
                                 <p className="text-sm text-gray-500">Controls randomness. Lower is more deterministic.</p>
                             </div>
                             <span className="font-mono text-gray-800">{settings.temperature.toFixed(1)}</span>
                         </div>
                         <input
                             type="range"
                             min="0"
                             max="1"
                             step="0.1"
                             value={settings.temperature}
                             onChange={(e) => onSettingsChange({ temperature: parseFloat(e.target.value) })}
                             className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-3"
                         />
                    </div>
                    
                    <h2 className="text-xl font-bold mt-8 mb-4">Data Management</h2>
                    <div className="space-y-4">
                        <button className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors">
                            Export All Chats
                        </button>
                        <button className="w-full text-left px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors">
                            Delete All Chats
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
