const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const newHeader = `          {/* TOP TAB NAVIGATION BAR */}
          {!isClientView && (
            <nav className="flex gap-1.5 overflow-x-auto hide-scrollbar flex-1 justify-start md:justify-center">
              {[
                { id: 'home', label: 'Home', icon: <Home size={14} /> },
                { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={14} /> },
                { id: 'guests', label: 'Intake & Guests', icon: <Users size={14} /> },
                { id: 'flights', label: 'Flights', icon: <Plane size={14} /> },
                { id: 'transfers', label: 'Transfers', icon: <Car size={14} /> },
                { id: 'rooming', label: 'Rooming', icon: <Hotel size={14} /> },
                { id: 'activities', label: 'Activities', icon: <Route size={14} /> },
                { id: 'finance', label: 'Finance', icon: <Coins size={14} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={\`top-tab \${activeTab === tab.id ? 'active' : ''}\`}
                >
                  {tab.icon}
                  <span className="hidden lg:inline font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {!isClientView && (
              <>
                <button onClick={saveItinerary} disabled={isSaving} className="btn-primary bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
                  <Save size={14} /> <span className="hidden md:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
                <button onClick={generateAIItinerary} disabled={isSaving} className="btn-primary bg-accent hover:bg-accent-hover text-white">
                  <Cloud size={14} /> <span className="hidden md:inline">Generate AI Itinerary</span>
                </button>
              </>
            )}
            <button 
              onClick={() => setIsClientView(!isClientView)} 
              className={\`btn-primary \${isClientView ? 'bg-rose text-white' : 'bg-gray-800 text-white'}\`}
            >
              <Eye size={14} /> <span className="hidden md:inline">{isClientView ? 'Exit Client View' : 'Client View'}</span>
            </button>
          </div>
`;

// replace from {/* TOP TAB NAVIGATION BAR */} to </nav>
content = content.replace(/\{\/\* TOP TAB NAVIGATION BAR \*\/\}[\s\S]*?<\/nav>/, newHeader);

fs.writeFileSync('src/App.tsx', content, 'utf8');
