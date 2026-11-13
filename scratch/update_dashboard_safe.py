with open('admin/src/components/dashboard/AdminDashboardOverview.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Transactions status & fields
old_txn = """                  recentTransactions.map((txn, idx) => (
                  <tr key={txn.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{txn.customer}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {txn.id} • {txn.date}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {txn.entity}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>
                      ₹{txn.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#0d9488', fontWeight: 800 }}>
                      ₹{txn.adminFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: '#ccfbf1', color: '#0d9488', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0d9488' }} />
                        {txn.status}
                      </span>
                    </td>"""

new_txn = """                  recentTransactions.map((txn, idx) => (
                  <tr key={txn.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>
                        {typeof txn.customer === 'object' && txn.customer !== null ? (txn.customer.name || 'Customer') : String(txn.customer || 'Customer')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {typeof txn.id === 'object' ? 'INV' : String(txn.id)} • {typeof txn.date === 'object' && txn.date !== null ? (txn.date.created_at || 'Recently') : String(txn.date || 'Recently')}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {typeof txn.entity === 'object' && txn.entity !== null ? (txn.entity.name || 'Merchant Entity') : String(txn.entity || 'Merchant Entity')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>
                      ₹{txn.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#0d9488', fontWeight: 800 }}>
                      ₹{txn.adminFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusBadge status={txn.status} fallback="completed" />
                    </td>"""

assert old_txn in c, "old_txn not found in AdminDashboardOverview.jsx"
c = c.replace(old_txn, new_txn)

# 2. Merchant Partners
old_merchant = """            {merchantPartners.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                No active merchant partners found.
              </div>
            ) : (
              merchantPartners.map((m, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>{m.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{m.category} • {m.count}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3569a7', background: '#eaf1f8', padding: '2px 6px', borderRadius: '4px' }}>
                    {m.share} Share
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Turnover: <strong>{m.gmv}</strong></span>
                  <span style={{ color: '#0d9488', fontWeight: 800 }}>Admin Cut: {m.adminCut}</span>
                </div>
              </div>
            )))}"""

new_merchant = """            {merchantPartners.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                No active merchant partners found.
              </div>
            ) : (
              merchantPartners.map((m, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                      {typeof m.name === 'object' && m.name !== null ? (m.name.name || 'Partner') : String(m.name || 'Partner')}
                    </div>
                    <CategoryBadge category={m.category} count={m.count} fallback="Entity" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3569a7', background: '#eaf1f8', padding: '2px 6px', borderRadius: '4px' }}>
                    {typeof m.share === 'object' ? '0%' : String(m.share || '0%')} Share
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Turnover: <strong>{typeof m.gmv === 'object' ? '₹0.00' : String(m.gmv || '₹0.00')}</strong></span>
                  <span style={{ color: '#0d9488', fontWeight: 800 }}>Admin Cut: {typeof m.adminCut === 'object' ? '₹0.00' : String(m.adminCut || '₹0.00')}</span>
                </div>
              </div>
            )))}"""

assert old_merchant in c, "old_merchant not found in AdminDashboardOverview.jsx"
c = c.replace(old_merchant, new_merchant)

# 3. Selected Invoice Modal
old_modal = """              <div style={{ background: '#eaf1f8', borderRadius: '8px', padding: '0.85rem', border: '1px solid #b3cbe6', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#3569a7', fontWeight: 700 }}>CORPORATE CLIENT</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{selectedInvoice.customer}</div>
                </div>
                <span style={{ background: '#ccfbf1', color: '#0d9488', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 800 }}>
                  ✓ {selectedInvoice.status?.toUpperCase()}
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Merchant Entity</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>{selectedInvoice.entity}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Date & Timestamp</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>{selectedInvoice.date}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Payment Mode</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>{selectedInvoice.paymentMethod}</td>
                  </tr>"""

new_modal = """              <div style={{ background: '#eaf1f8', borderRadius: '8px', padding: '0.85rem', border: '1px solid #b3cbe6', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#3569a7', fontWeight: 700 }}>CORPORATE CLIENT</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                    {typeof selectedInvoice.customer === 'object' && selectedInvoice.customer !== null ? (selectedInvoice.customer.name || 'Customer') : String(selectedInvoice.customer || 'Customer')}
                  </div>
                </div>
                <StatusBadge status={selectedInvoice.status} fallback="Completed" />
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Merchant Entity</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>
                      {typeof selectedInvoice.entity === 'object' && selectedInvoice.entity !== null ? (selectedInvoice.entity.name || 'Merchant Entity') : String(selectedInvoice.entity || 'Merchant Entity')}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Date & Timestamp</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>
                      {typeof selectedInvoice.date === 'object' && selectedInvoice.date !== null ? (selectedInvoice.date.created_at || 'Recently') : String(selectedInvoice.date || 'Recently')}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Payment Mode</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>
                      {typeof selectedInvoice.paymentMethod === 'object' && selectedInvoice.paymentMethod !== null ? (selectedInvoice.paymentMethod.name || 'Direct') : String(selectedInvoice.paymentMethod || 'Direct Settlement')}
                    </td>
                  </tr>"""

assert old_modal in c, "old_modal not found in AdminDashboardOverview.jsx"
c = c.replace(old_modal, new_modal)

with open('admin/src/components/dashboard/AdminDashboardOverview.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('SUCCESSFULLY updated AdminDashboardOverview.jsx')
