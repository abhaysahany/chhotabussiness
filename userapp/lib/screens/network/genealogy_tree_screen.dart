import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../services/network_service.dart';
import '../../widgets/app_drawer.dart';

class GenealogyTreeScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const GenealogyTreeScreen({super.key, required this.user});

  @override
  State<GenealogyTreeScreen> createState() => _GenealogyTreeScreenState();
}

class _GenealogyTreeScreenState extends State<GenealogyTreeScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _rootNode;
  Map<String, dynamic>? _treeStats;
  int _treeDepth = 10;
  String _searchQuery = '';

  final Set<String> _expandedNodeIds = {};

  @override
  void initState() {
    super.initState();
    _fetchTree();
  }

  Future<void> _fetchTree() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final userCode = widget.user['user_code']?.toString() ?? widget.user['userCode']?.toString();
      final res = await NetworkService.getGenealogyTree(userCode: userCode, depth: _treeDepth);
      if (mounted) {
        setState(() {
          _rootNode = (res['tree'] ?? res['treeData']) as Map<String, dynamic>?;
          _treeStats = res['stats'] as Map<String, dynamic>?;
          if (_rootNode != null && _rootNode!['id'] != null) {
            _expandedNodeIds.add(_rootNode!['id'].toString());
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  void _showNodeModal(Map<String, dynamic> node) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final name = node['name']?.toString() ?? 'Member';
        final id = node['id']?.toString() ?? '—';
        final rank = node['rank']?.toString() ?? 'Bronze';
        final level = node['level']?.toString() ?? '0';
        final sponsor = node['sponsorName']?.toString() ?? node['parentName']?.toString() ?? 'Direct';
        final personalPv = node['personalPv']?.toString() ?? '0';
        final groupPv = node['groupPv']?.toString() ?? '0';
        final status = node['status']?.toString() ?? 'active';

        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: AppColors.primary,
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'M',
                      style: GoogleFonts.poppins(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textHeading,
                          ),
                        ),
                        Text(
                          'ID: $id • Gen Level $level',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.secondary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 12),
              _buildModalRow('Rank Title', rank),
              _buildModalRow('Parent / Sponsor', sponsor),
              _buildModalRow('Personal PV', personalPv),
              _buildModalRow('Group Turnover PV', groupPv),
              _buildModalRow('Member Status', status.toUpperCase()),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildModalRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textHeading),
          ),
        ],
      ),
    );
  }

  Widget _buildTreeNodeView(Map<String, dynamic> node, int depth) {
    final id = node['id']?.toString() ?? '';
    final name = node['name']?.toString() ?? 'Member';
    final rank = node['rank']?.toString() ?? 'Bronze';
    final level = node['level']?.toString() ?? '$depth';
    final overridePct = node['overridePct']?.toString() ?? '2%';
    final rawChildren = node['children'];
    final List<dynamic> children = rawChildren is List ? rawChildren : [];
    final hasChildren = children.isNotEmpty;
    final isExpanded = _expandedNodeIds.contains(id);

    final isMatchSearch = _searchQuery.isNotEmpty &&
        (name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            id.toLowerCase().contains(_searchQuery.toLowerCase()));

    return Container(
      margin: EdgeInsets.only(left: depth > 0 ? 16 : 0, top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () => _showNodeModal(node),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isMatchSearch ? const Color(0xFFFEF3C7) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isMatchSearch
                      ? AppColors.secondary
                      : (depth == 0 ? AppColors.primary : AppColors.cardBorder),
                  width: depth == 0 ? 1.5 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  if (hasChildren)
                    IconButton(
                      icon: Icon(
                        isExpanded ? Icons.remove_circle_outline : Icons.add_circle_outline,
                        size: 20,
                        color: AppColors.primary,
                      ),
                      onPressed: () {
                        setState(() {
                          if (isExpanded) {
                            _expandedNodeIds.remove(id);
                          } else {
                            _expandedNodeIds.add(id);
                          }
                        });
                      },
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    )
                  else
                    const SizedBox(width: 20),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: depth == 0 ? AppColors.secondary : AppColors.primaryLight,
                    child: Text(
                      name.isNotEmpty ? name[0].toUpperCase() : 'M',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: depth == 0 ? Colors.white : AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textHeading,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'ID: $id • $rank',
                          style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: depth == 0 ? AppColors.primaryLight : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      depth == 0 ? 'ROOT' : 'L$level ($overridePct)',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: depth == 0 ? AppColors.primary : AppColors.textHeading,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (hasChildren && isExpanded)
            Padding(
              padding: const EdgeInsets.only(left: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: children.map((c) {
                  final cMap = c is Map<String, dynamic> ? c : Map<String, dynamic>.from(c as Map);
                  return _buildTreeNodeView(cMap, depth + 1);
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalNetwork = _treeStats?['totalNodes'] ?? 0;
    final directDownlines = _treeStats?['directCount'] ?? 0;
    final maxLevel = _treeStats?['maxLevelReached'] ?? 1;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Genealogy Tree',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 18),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchTree,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Summary Stats Banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F4C81), Color(0xFF1E3A8A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildBannerStat('Total Network', '$totalNetwork'),
                    Container(width: 1, height: 36, color: Colors.white24),
                    _buildBannerStat('Direct Downlines', '$directDownlines'),
                    Container(width: 1, height: 36, color: Colors.white24),
                    _buildBannerStat('Max Depth', 'L$maxLevel'),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Search Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: 'Search partner in tree...',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textLight),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                    border: InputBorder.none,
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Tree View Container
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_error != null)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.errorLight,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.errorBorder),
                  ),
                  child: Text(_error!, style: GoogleFonts.inter(color: AppColors.error)),
                )
              else if (_rootNode == null)
                Container(
                  padding: const EdgeInsets.all(36),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Center(
                    child: Text('No genealogy data available.', style: GoogleFonts.inter(color: AppColors.textMuted)),
                  ),
                )
              else ...[
                Text(
                  '10-Level Unilevel Tree Structure',
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textHeading,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Tap on +/- to expand downlines, or tap a partner card to view profile.',
                  style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                ),
                const SizedBox(height: 10),
                _buildTreeNodeView(_rootNode!, 0),
              ],
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBannerStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFFCBD5E1)),
        ),
      ],
    );
  }
}
