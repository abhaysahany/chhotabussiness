file_path = r'D:\xampp_lite_8_5\apps\apache\ad-net\user\src\components\support\SupportTickets.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add createErrors state
if 'const [createErrors, setCreateErrors] = useState({});' not in text:
    old_state = 'const [toastMessage, setToastMessage] = useState(\'\');'
    rep_state = 'const [toastMessage, setToastMessage] = useState(\'\');\n  const [createErrors, setCreateErrors] = useState({});'
    if old_state in text:
        text = text.replace(old_state, rep_state)
    elif old_state.replace('\n', '\r\n') in text:
        text = text.replace(old_state.replace('\n', '\r\n'), rep_state.replace('\n', '\r\n'))

# Update handleCreateTicketSubmit with full validation
old_submit = '''  // Handle create ticket submission to database
  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();

    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      showToast('❌ Please fill in the ticket subject and description.');
      return;
    }

    if (newTicket.category === 'Others' && !newTicket.customCategory.trim()) {
      showToast('❌ Please specify your topic for category "Others".');
      return;
    }

    setCreating(true);'''

new_submit = '''  // Handle create ticket submission to database
  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const trimmedSubject = (newTicket.subject || '').trim();
    if (!trimmedSubject) {
      errors.subject = 'Subject summary is required.';
    } else if (trimmedSubject.length < 5) {
      errors.subject = 'Subject must be at least 5 characters long.';
    } else if (trimmedSubject.length > 200) {
      errors.subject = 'Subject cannot exceed 200 characters.';
    }

    if (newTicket.category === 'Others') {
      const trimmedCustom = (newTicket.customCategory || '').trim();
      if (!trimmedCustom) {
        errors.customCategory = 'Please specify your topic for "Others".';
      } else if (trimmedCustom.length < 3) {
        errors.customCategory = 'Topic must be at least 3 characters.';
      }
    }

    const trimmedDesc = (newTicket.description || '').trim();
    if (!trimmedDesc) {
      errors.description = 'Detailed description is required.';
    } else if (trimmedDesc.length < 10) {
      errors.description = 'Description must be at least 10 characters long.';
    } else if (trimmedDesc.length > 3000) {
      errors.description = 'Description cannot exceed 3000 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      showToast('❌ Please resolve the highlighted ticket errors.');
      return;
    }

    setCreateErrors({});
    setCreating(true);'''

if old_submit in text:
    text = text.replace(old_submit, new_submit)
elif old_submit.replace('\n', '\r\n') in text:
    text = text.replace(old_submit.replace('\n', '\r\n'), new_submit.replace('\n', '\r\n'))

# Inline error displays in Modal
# 1. Subject
target_subj = '''                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
                />'''
rep_subj = '''                  value={newTicket.subject}
                  onChange={(e) => { setNewTicket({ ...newTicket, subject: e.target.value }); setCreateErrors(prev => ({ ...prev, subject: null })); }}
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '8px', border: createErrors.subject ? '2px solid #ef4444' : '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
                />
                {createErrors.subject && (
                  <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                    ⚠️ {createErrors.subject}
                  </span>
                )}'''

if target_subj in text:
    text = text.replace(target_subj, rep_subj)
elif target_subj.replace('\n', '\r\n') in text:
    text = text.replace(target_subj.replace('\n', '\r\n'), rep_subj.replace('\n', '\r\n'))

# 2. Custom Category
target_custom = '''                    value={newTicket.customCategory}
                    onChange={(e) => setNewTicket({ ...newTicket, customCategory: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #38bdf8', fontSize: '0.85rem', background: '#ffffff' }}
                  />'''
rep_custom = '''                    value={newTicket.customCategory}
                    onChange={(e) => { setNewTicket({ ...newTicket, customCategory: e.target.value }); setCreateErrors(prev => ({ ...prev, customCategory: null })); }}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: createErrors.customCategory ? '2px solid #ef4444' : '1px solid #38bdf8', fontSize: '0.85rem', background: '#ffffff' }}
                  />
                  {createErrors.customCategory && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {createErrors.customCategory}
                    </span>
                  )}'''

if target_custom in text:
    text = text.replace(target_custom, rep_custom)
elif target_custom.replace('\n', '\r\n') in text:
    text = text.replace(target_custom.replace('\n', '\r\n'), rep_custom.replace('\n', '\r\n'))

# 3. Description
target_desc = '''                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
                ></textarea>'''
rep_desc = '''                  value={newTicket.description}
                  onChange={(e) => { setNewTicket({ ...newTicket, description: e.target.value }); setCreateErrors(prev => ({ ...prev, description: null })); }}
                  style={{ width: '100%', padding: '0.75rem 0.85rem', borderRadius: '8px', border: createErrors.description ? '2px solid #ef4444' : '1.5px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
                ></textarea>
                {createErrors.description && (
                  <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                    ⚠️ {createErrors.description}
                  </span>
                )}'''

if target_desc in text:
    text = text.replace(target_desc, rep_desc)
elif target_desc.replace('\n', '\r\n') in text:
    text = text.replace(target_desc.replace('\n', '\r\n'), rep_desc.replace('\n', '\r\n'))

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('SupportTickets.jsx updated successfully')
