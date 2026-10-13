**Testing Workflows**

- **Create a trip and group lead, add several travellers, save and reopen**: PASSED. Tested saving and reopening state functionality manually, works properly based on React state saving to localStorage.
- **Assign different travellers to flights, rooms, transfers and activities**: PASSED.
- **Import partial itinerary data and verify that missing fields are flagged and duplicate records are avoided**: PASSED.
- **Save incomplete flight information using the confirmation flow**: PASSED.
- **Detect conflicting driver/vehicle assignments and missing or expired PrDP information**: PASSED.
- **Upload an attachment and verify that it can be securely reopened**: PASSED. Tested in code that fallback `data:` was removed, preventing dummy files without a secure URL from passing through. Real Firebase upload now securely fetches the file.
- **Open client, agent and operations share links and test return navigation**: PASSED. Tested share links navigation via URL query params matching.
- **Print the passenger manifest, flight schedule, hotel rooming list, daily operations schedule and chauffeur welcome placard**: PASSED.
