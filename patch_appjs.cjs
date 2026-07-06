const fs = require('fs');
let code = fs.readFileSync('public/app.js', 'utf8');

// Replace inline handlers in addGuest
code = code.replace(
  '<button onclick="this.parentElement.remove(); app.updateTotals();" class="text-red-400 hover:text-red-600 p-2"><i class="fa-solid fa-trash"></i></button>',
  '<button class="text-red-400 hover:text-red-600 p-2 delete-btn"><i class="fa-solid fa-trash"></i></button>'
);

// Replace inline handlers in addTransfer
code = code.replace(
  '<input type="number" placeholder="Cost" class="g-input !w-24 !bg-white transfer-cost" onkeyup="window.app.updateTotals()">',
  '<input type="number" placeholder="Cost" class="g-input !w-24 !bg-white transfer-cost">'
);
code = code.replace(
  '<button onclick="this.parentElement.remove(); window.app.updateTotals();" class="text-red-400 hover:text-red-600 p-2"><i class="fa-solid fa-trash"></i></button>',
  '<button class="text-red-400 hover:text-red-600 p-2 delete-btn"><i class="fa-solid fa-trash"></i></button>'
);

// Replace inline handlers in autoAssignRooms
code = code.replace(
  '<button onclick="this.parentElement.parentElement.remove(); window.app.updateTotals();" class="text-gray-400 hover:text-red-500"><i class="fa-solid fa-xmark"></i></button>',
  '<button class="text-gray-400 hover:text-red-500 delete-room-btn"><i class="fa-solid fa-xmark"></i></button>'
);
code = code.replace(
  '<input type="number" placeholder="Cost per night" class="g-input room-cost" value="150" onkeyup="window.app.updateTotals()">',
  '<input type="number" placeholder="Cost per night" class="g-input room-cost" value="150">'
);

fs.writeFileSync('public/app.js', code);
console.log('Patched public/app.js');
