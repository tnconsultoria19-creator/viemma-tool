const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const mainLogic = `        {saveMessage && (
          <div className="fixed top-20 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-4">
            {saveMessage}
          </div>
        )}

        {isClientView ? (
          <ClientView state={state} />
        ) : (
          <>
            {activeTab === 'home' && (`;

content = content.replace(`{activeTab === 'home' && (`, mainLogic);

content = content.replace(`        </div>\n      </main>`, `          </>\n        )}\n        </div>\n      </main>`);

fs.writeFileSync('src/App.tsx', content, 'utf8');
