import re

# 1. AdminPackagesPage.jsx
path_pkg = 'admin/src/components/products/AdminPackagesPage.jsx'
with open(path_pkg, 'r', encoding='utf-8') as f:
    pkg_content = f.read()

# Add import
old_import = "import api from '../../api/axios';"
new_import = """import api from '../../api/axios';
import { getBusinessEntities, getFreelancers } from '../../api/adminEntityService';"""
if old_import in pkg_content:
    pkg_content = pkg_content.replace(old_import, new_import, 1)

# Replace static arrays with state
old_static_biz = """  // Registered Businesses & Freelancers
  const registeredBusinesses = [
    'GrowthX Media Solutions',
    'Skyline Technologies Pvt Ltd',
    'AddNet Tax Advisory',
  ];

  const registeredFreelancers = [
    'Priya Patel (UI/UX Designer)',
    'Rohan Sharma (Full Stack Dev)',
    'Amit Kumar (SEO Specialist)',
  ];"""

new_static_biz = """  // Registered Businesses & Freelancers from Database
  const [registeredBusinesses, setRegisteredBusinesses] = useState([]);
  const [registeredFreelancers, setRegisteredFreelancers] = useState([]);"""
if old_static_biz in pkg_content:
    pkg_content = pkg_content.replace(old_static_biz, new_static_biz, 1)

# Update loadPackages to fetch entities
old_load = """  // Fetch Packages from MySQL Database
  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/catalog/packages');
      if (res.data?.packages) {
        setPackages(res.data.packages.map((k) => ({
          ...k,
          price: Number(k.price) || 0,
          adminCommissionPercent: Number(k.commission_percent ?? k.adminCommissionPercent) || 18,
          billingCycle: k.billingCycle || 'Monthly Recurring',
          ownerType: k.ownerType || 'business',
          ownerName: k.ownerName || 'Skyline Technologies Pvt Ltd',
          image: k.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        })));
      }
    } catch (err) {
      console.error('Error fetching packages from database:', err);
    } finally {
      setLoading(false);
    }
  };"""

new_load = """  // Fetch Packages and Entity Owners from MySQL Database
  const loadPackages = async () => {
    setLoading(true);
    try {
      const [pkgRes, bizRes, freeRes] = await Promise.allSettled([
        api.get('/catalog/packages'),
        getBusinessEntities(),
        getFreelancers(),
      ]);

      if (bizRes.status === 'fulfilled' && bizRes.value?.businesses) {
        setRegisteredBusinesses(bizRes.value.businesses.map((b) => b.name || b.business_name).filter(Boolean));
      }
      if (freeRes.status === 'fulfilled' && freeRes.value?.freelancers) {
        setRegisteredFreelancers(freeRes.value.freelancers.map((f) => f.name || f.full_name).filter(Boolean));
      }
      if (pkgRes.status === 'fulfilled' && pkgRes.value?.data?.packages) {
        setPackages(pkgRes.value.data.packages.map((k) => ({
          ...k,
          price: Number(k.price) || 0,
          adminCommissionPercent: Number(k.commission_percent ?? k.adminCommissionPercent) || 18,
          billingCycle: k.billingCycle || 'Monthly Recurring',
          ownerType: k.ownerType || 'business',
          ownerName: k.ownerName || '',
          image: k.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        })));
      }
    } catch (err) {
      console.error('Error fetching packages from database:', err);
    } finally {
      setLoading(false);
    }
  };"""
if old_load in pkg_content:
    pkg_content = pkg_content.replace(old_load, new_load, 1)

# Replace ownerName fallbacks
pkg_content = pkg_content.replace("ownerName: registeredBusinesses[0],", "ownerName: registeredBusinesses[0] || '',")
pkg_content = pkg_content.replace("ownerName: type === 'business' ? registeredBusinesses[0] : registeredFreelancers[0],", "ownerName: type === 'business' ? (registeredBusinesses[0] || '') : (registeredFreelancers[0] || ''),")

# Replace select options with empty state
old_select_map = """                <select
                  className="pro-select-input"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  required
                >
                  {(formData.ownerType === 'business' ? registeredBusinesses : registeredFreelancers).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>"""

new_select_map = """                <select
                  className="pro-select-input"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  required
                >
                  {(formData.ownerType === 'business' ? registeredBusinesses : registeredFreelancers).length === 0 ? (
                    <option value="">No registered {formData.ownerType === 'business' ? 'businesses' : 'freelancers'}</option>
                  ) : (
                    (formData.ownerType === 'business' ? registeredBusinesses : registeredFreelancers).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))
                  )}
                </select>"""
assert old_select_map in pkg_content
pkg_content = pkg_content.replace(old_select_map, new_select_map, 1)

with open(path_pkg, 'w', encoding='utf-8') as f:
    f.write(pkg_content)
print("AdminPackagesPage updated successfully.")

# 2. AdminProductsPage.jsx
path_prod = 'admin/src/components/products/AdminProductsPage.jsx'
with open(path_prod, 'r', encoding='utf-8') as f:
    prod_content = f.read()

prod_content = prod_content.replace(
    "defaultOwner = businessesList.length > 0 ? (businessesList[0].name || businessesList[0].business_name || 'Skyline Technologies Pvt Ltd') : 'Skyline Technologies Pvt Ltd';",
    "defaultOwner = businessesList.length > 0 ? (businessesList[0].name || businessesList[0].business_name || '') : '';"
)
prod_content = prod_content.replace(
    "defaultOwner = freelancersList.length > 0 ? (freelancersList[0].name || freelancersList[0].full_name || 'Priya Patel (UI/UX Designer)') : 'Priya Patel (UI/UX Designer)';",
    "defaultOwner = freelancersList.length > 0 ? (freelancersList[0].name || freelancersList[0].full_name || '') : '';"
)
prod_content = prod_content.replace(
    "const defaultBiz = businessesList.length > 0 ? (businessesList[0].name || businessesList[0].business_name || 'Skyline Technologies Pvt Ltd') : 'Skyline Technologies Pvt Ltd';",
    "const defaultBiz = businessesList.length > 0 ? (businessesList[0].name || businessesList[0].business_name || '') : '';"
)
prod_content = prod_content.replace(
    '<option value="Skyline Technologies Pvt Ltd">Skyline Technologies Pvt Ltd</option>',
    '<option value="">No businesses registered</option>'
)
prod_content = prod_content.replace(
    '<option value="Priya Patel (UI/UX Designer)">Priya Patel (UI/UX Designer)</option>',
    '<option value="">No freelancers registered</option>'
)

with open(path_prod, 'w', encoding='utf-8') as f:
    f.write(prod_content)
print("AdminProductsPage updated successfully.")

# 3. AdminServicesPage.jsx
path_serv = 'admin/src/components/products/AdminServicesPage.jsx'
with open(path_serv, 'r', encoding='utf-8') as f:
    serv_content = f.read()

serv_content = serv_content.replace(
    "defaultOwner = businessesList.length > 0 ? businessesList[0].business_name : 'Skyline Technologies Pvt Ltd';",
    "defaultOwner = businessesList.length > 0 ? (businessesList[0].business_name || businessesList[0].name || '') : '';"
)
serv_content = serv_content.replace(
    "defaultOwner = freelancersList.length > 0 ? freelancersList[0].full_name : 'Priya Patel (UI/UX Designer)';",
    "defaultOwner = freelancersList.length > 0 ? (freelancersList[0].full_name || freelancersList[0].name || '') : '';"
)
serv_content = serv_content.replace(
    '<option value="Priya Patel">Priya Patel</option>',
    '<option value="">No freelancers registered</option>'
)

with open(path_serv, 'w', encoding='utf-8') as f:
    f.write(serv_content)
print("AdminServicesPage updated successfully.")

# 4. AdminContentLibraryPage.jsx
path_content = 'admin/src/components/content/AdminContentLibraryPage.jsx'
with open(path_content, 'r', encoding='utf-8') as f:
    c_content = f.read()

c_content = c_content.replace(
    "else if (nextType === 'business') defaultName = 'Skyline Technologies Pvt Ltd';",
    "else if (nextType === 'business') defaultName = '';"
)
c_content = c_content.replace(
    "else if (nextType === 'freelance') defaultName = 'Priya Patel UI/UX Freelance';",
    "else if (nextType === 'freelance') defaultName = '';"
)

with open(path_content, 'w', encoding='utf-8') as f:
    f.write(c_content)
print("AdminContentLibraryPage updated successfully.")

# 5. AdminContactInquiriesPage.jsx
path_inq = 'admin/src/components/support/AdminContactInquiriesPage.jsx'
with open(path_inq, 'r', encoding='utf-8') as f:
    inq_content = f.read()

old_inq_state = """  const [callbacks, setCallbacks] = useState([
    { id: 1, name: 'Rajesh Sharma', phone: '+91 98765 43210', topic: 'Franchise & Binary Commission Plan', time: '10 mins ago', status: 'Pending' },
    { id: 2, name: 'Priya Patel', phone: '+91 91234 56789', topic: 'KYC Document Verification Delay', time: '45 mins ago', status: 'Contacted' },
  ]);"""

new_inq_state = "  const [callbacks, setCallbacks] = useState([]);"
if old_inq_state in inq_content:
    inq_content = inq_content.replace(old_inq_state, new_inq_state, 1)

old_inq_render = """        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {callbacks.map((c) => ("""

new_inq_render = """        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {callbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No pending phone callback requests in queue.
            </div>
          ) : (
            callbacks.map((c) => ("""
if old_inq_render in inq_content:
    inq_content = inq_content.replace(old_inq_render, new_inq_render, 1)

old_inq_close = """              </div>
            </div>
          ))}
        </div>"""

new_inq_close = """              </div>
            </div>
          )))}
        </div>"""
if old_inq_close in inq_content:
    inq_content = inq_content.replace(old_inq_close, new_inq_close, 1)

with open(path_inq, 'w', encoding='utf-8') as f:
    f.write(inq_content)
print("AdminContactInquiriesPage updated successfully.")

# 6. AdminLiveHelpdeskPage.jsx
path_live = 'admin/src/components/support/AdminLiveHelpdeskPage.jsx'
with open(path_live, 'r', encoding='utf-8') as f:
    live_content = f.read()

old_live_state = """  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'sess-101',
      userName: 'Tom Phillip',
      userEmail: 'tom@addnet.com',
      status: 'Live Agent Requested',
      lastMsg: 'I want to speak with a human support agent.',
      time: '1 min ago',
      agent: 'Unassigned',
      messages: [
        { sender: 'bot', name: 'AI Concierge', text: 'Welcome to AddNet Live Support! How can I assist?' },
        { sender: 'user', name: 'Tom Phillip', text: 'I want to speak with a human support agent.' },
        { sender: 'bot', name: 'AI Concierge', text: 'Queuing your chat for senior support specialist...' },
      ],
    },
    {
      id: 'sess-102',
      userName: 'Sara Jenkins',
      userEmail: 'sara@addnet.com',
      status: 'AI Active',
      lastMsg: 'Explain how binary level matching commission is calculated.',
      time: '3 mins ago',
      agent: 'AI Concierge',
      messages: [
        { sender: 'bot', name: 'AI Concierge', text: 'Hello Sara! How can I assist your business today?' },
        { sender: 'user', name: 'Sara Jenkins', text: 'Explain how binary level matching commission is calculated.' },
        { sender: 'bot', name: 'AI Concierge', text: 'Binary matching is calculated at 10% on balanced BV between left and right leg.' },
      ],
    },
  ]);

  const [selectedSessId, setSelectedSessId] = useState('sess-101');"""

new_live_state = """  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSessId, setSelectedSessId] = useState('');"""

if old_live_state in live_content:
    live_content = live_content.replace(old_live_state, new_live_state, 1)

old_live_map = """          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {activeSessions.map((s) => {"""

new_live_map = """          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {activeSessions.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No live support sessions currently active.
              </div>
            ) : (
              activeSessions.map((s) => {"""
if old_live_map in live_content:
    live_content = live_content.replace(old_live_map, new_live_map, 1)

old_live_map_close = """              );
            })}
          </div>"""

new_live_map_close = """              );
            }))}
          </div>"""
if old_live_map_close in live_content:
    live_content = live_content.replace(old_live_map_close, new_live_map_close, 1)

with open(path_live, 'w', encoding='utf-8') as f:
    f.write(live_content)
print("AdminLiveHelpdeskPage updated successfully.")
