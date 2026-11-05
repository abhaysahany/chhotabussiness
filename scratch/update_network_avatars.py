# Update DirectConnectionsPage.jsx
with open('user/src/pages/network/DirectConnectionsPage.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_cell = """          <img
            src={row.avatar || '/logo.png'}
            alt={val}
            className="cell-avatar"
            onError={(e) => {
              e.target.src = '/logo.png';
            }}
          />"""

new_cell = """          {row.avatar && row.avatar !== '/logo.png' ? (
            <img
              src={row.avatar}
              alt={val}
              className="cell-avatar"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="cell-avatar"
            style={{
              display: (row.avatar && row.avatar !== '/logo.png') ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0F4C81',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {val ? val.charAt(0).toUpperCase() : 'U'}
          </div>"""

text = text.replace(old_cell.replace('\n', '\r\n'), new_cell.replace('\n', '\r\n'))
text = text.replace(old_cell, new_cell)

old_modal = """                <img
                  src={selectedMember.avatar || '/logo.png'}
                  alt={selectedMember.name}
                  className="modal-avatar-lg"
                />"""

new_modal = """                {selectedMember.avatar && selectedMember.avatar !== '/logo.png' ? (
                  <img
                    src={selectedMember.avatar}
                    alt={selectedMember.name}
                    className="modal-avatar-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="modal-avatar-lg"
                  style={{
                    display: (selectedMember.avatar && selectedMember.avatar !== '/logo.png') ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0F4C81',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                  }}
                >
                  {selectedMember.name ? selectedMember.name.charAt(0).toUpperCase() : 'U'}
                </div>"""

text = text.replace(old_modal.replace('\n', '\r\n'), new_modal.replace('\n', '\r\n'))
text = text.replace(old_modal, new_modal)

with open('user/src/pages/network/DirectConnectionsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

# Update TeamConnectionsPage.jsx
with open('user/src/pages/network/TeamConnectionsPage.jsx', 'r', encoding='utf-8') as f:
    ttext = f.read()

ttext = ttext.replace(old_cell.replace('\n', '\r\n'), new_cell.replace('\n', '\r\n'))
ttext = ttext.replace(old_cell, new_cell)
ttext = ttext.replace(old_modal.replace('\n', '\r\n'), new_modal.replace('\n', '\r\n'))
ttext = ttext.replace(old_modal, new_modal)

with open('user/src/pages/network/TeamConnectionsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(ttext)

# Update GenealogyTreePage.jsx
with open('user/src/pages/network/GenealogyTreePage.jsx', 'r', encoding='utf-8') as f:
    gtext = f.read()

old_genealogy = """          <div className="node-avatar-container">
            <img
              src={node.avatar}
              alt={node.name}
              className="node-avatar-img"
              onError={(e) => {
                e.target.src = '/logo.png';
              }}
            />
            <span className={`status-dot ${node.status}`} title={`Status: ${node.status}`}></span>
          </div>"""

new_genealogy = """          <div className="node-avatar-container">
            {node.avatar && node.avatar !== '/logo.png' ? (
              <img
                src={node.avatar}
                alt={node.name}
                className="node-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="node-avatar-img"
              style={{
                display: (node.avatar && node.avatar !== '/logo.png') ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0F4C81',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {node.name ? node.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className={`status-dot ${node.status}`} title={`Status: ${node.status}`}></span>
          </div>"""

gtext = gtext.replace(old_genealogy.replace('\n', '\r\n'), new_genealogy.replace('\n', '\r\n'))
gtext = gtext.replace(old_genealogy, new_genealogy)

with open('user/src/pages/network/GenealogyTreePage.jsx', 'w', encoding='utf-8') as f:
    f.write(gtext)

print('Network pages updated successfully.')
