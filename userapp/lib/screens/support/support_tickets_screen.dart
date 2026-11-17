import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../constants/app_colors.dart';
import '../../services/support_service.dart';
import '../../widgets/app_drawer.dart';

class SupportTicketsScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const SupportTicketsScreen({super.key, required this.user});

  @override
  State<SupportTicketsScreen> createState() => _SupportTicketsScreenState();
}

class _SupportTicketsScreenState extends State<SupportTicketsScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _tickets = [];

  String _searchQuery = '';
  String _selectedStatus = 'All';

  final List<String> _categories = [
    'Commission, Wallet & Withdrawals',
    'Account, Profile & Security',
    'KYC Verification (PAN / Aadhaar UID)',
    'Bank & UPI Payout Credentials',
    'Diamonds & Rank Progression',
    'Milestone Rewards & Gift Claims',
    'Direct & Team Network Downlines',
    'Product Orders & Package Services',
    'Billing, Invoices & Payment Gateway',
    'Technical, Bug & App Login Issues',
    'Others',
  ];

  @override
  void initState() {
    super.initState();
    _fetchTickets();
  }

  Future<void> _fetchTickets() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await SupportService.getTickets(
        status: _selectedStatus == 'All' ? null : _selectedStatus,
        search: _searchQuery.isEmpty ? null : _searchQuery,
      );
      if (mounted) {
        setState(() {
          _tickets = res;
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

  void _openCreateTicketModal() {
    final subjectController = TextEditingController();
    final descriptionController = TextEditingController();
    String category = _categories.first;
    String priority = 'Medium';
    bool submitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Create Support Ticket',
                  style: GoogleFonts.poppins(fontSize: 17, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: subjectController,
                  decoration: const InputDecoration(labelText: 'Subject *', border: OutlineInputBorder(), isDense: true),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: category,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Category *', border: OutlineInputBorder(), isDense: true),
                  items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 12)))).toList(),
                  onChanged: (val) {
                    if (val != null) setModalState(() => category = val);
                  },
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: priority,
                  decoration: const InputDecoration(labelText: 'Priority', border: OutlineInputBorder(), isDense: true),
                  items: const [
                    DropdownMenuItem(value: 'Low', child: Text('Low')),
                    DropdownMenuItem(value: 'Medium', child: Text('Medium')),
                    DropdownMenuItem(value: 'High', child: Text('High')),
                    DropdownMenuItem(value: 'Urgent', child: Text('Urgent')),
                  ],
                  onChanged: (val) {
                    if (val != null) setModalState(() => priority = val);
                  },
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: descriptionController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Describe your issue in detail *',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: submitting
                        ? null
                        : () async {
                            if (subjectController.text.trim().isEmpty || descriptionController.text.trim().isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Subject and description are required')),
                              );
                              return;
                            }
                            setModalState(() => submitting = true);
                            try {
                              await SupportService.createTicket(
                                subject: subjectController.text.trim(),
                                category: category,
                                priority: priority,
                                description: descriptionController.text.trim(),
                              );
                              if (ctx.mounted) Navigator.pop(ctx);
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Support ticket created successfully!'),
                                    backgroundColor: AppColors.success,
                                  ),
                                );
                                _fetchTickets();
                              }
                            } catch (e) {
                              setModalState(() => submitting = false);
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: AppColors.error),
                                );
                              }
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: submitting
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text('Submit Ticket', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openTicketChat(Map<String, dynamic> ticket) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => TicketChatScreen(ticket: ticket, user: widget.user),
      ),
    ).then((_) => _fetchTickets());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Support Tickets Desk',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 17),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primary),
            tooltip: 'New Ticket',
            onPressed: _openCreateTicketModal,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchTickets,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Search Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: TextField(
                  onChanged: (val) {
                    setState(() => _searchQuery = val);
                    _fetchTickets();
                  },
                  decoration: InputDecoration(
                    hintText: 'Search tickets by code or subject...',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textLight),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                    border: InputBorder.none,
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Status Filter Tabs
              SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildStatusPill('All Status'),
                    const SizedBox(width: 6),
                    _buildStatusPill('Open'),
                    const SizedBox(width: 6),
                    _buildStatusPill('In Progress'),
                    const SizedBox(width: 6),
                    _buildStatusPill('Resolved'),
                    const SizedBox(width: 6),
                    _buildStatusPill('Closed'),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Tickets List
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
              else if (_tickets.isEmpty)
                Container(
                  padding: const EdgeInsets.all(36),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Center(
                    child: Column(
                      children: [
                        const Icon(Icons.support_agent_rounded, size: 48, color: AppColors.textLight),
                        const SizedBox(height: 10),
                        Text(
                          'No support tickets found',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: AppColors.textHeading),
                        ),
                        Text(
                          'Create a ticket if you need assistance with payouts or accounts',
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 14),
                        ElevatedButton.icon(
                          onPressed: _openCreateTicketModal,
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text('Open Support Ticket'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ..._tickets.map((t) {
                  final ticketMap = t is Map<String, dynamic> ? t : Map<String, dynamic>.from(t as Map);
                  final code = ticketMap['ticket_code'] ?? ticketMap['id'] ?? 'TK-00';
                  final subject = ticketMap['subject']?.toString() ?? 'Support Request';
                  final category = ticketMap['category']?.toString() ?? 'General';
                  final status = ticketMap['status']?.toString() ?? 'Open';
                  final priority = ticketMap['priority']?.toString() ?? 'Medium';
                  final updated = ticketMap['updated_at']?.toString().split('T').first ?? '—';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.cardBorder),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: InkWell(
                      onTap: () => _openTicketChat(ticketMap),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '$code',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                              ),
                              Row(
                                children: [
                                  _buildPriorityBadge(priority),
                                  const SizedBox(width: 6),
                                  _buildStatusBadge(status),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            subject,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textHeading,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                category,
                                style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                              ),
                              Text(
                                'Updated: $updated',
                                style: GoogleFonts.inter(fontSize: 10, color: AppColors.textLight),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusPill(String label) {
    final filterKey = label == 'All Status' ? 'All' : label;
    final isSelected = _selectedStatus == filterKey;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedStatus = filterKey);
        _fetchTickets();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.cardBorder),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg = AppColors.primaryLight;
    Color text = AppColors.primary;
    final s = status.toLowerCase();
    if (s == 'resolved' || s == 'closed') {
      bg = AppColors.successLight;
      text = AppColors.success;
    } else if (s == 'in progress') {
      bg = AppColors.warningLight;
      text = AppColors.warning;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4)),
      child: Text(
        status.toUpperCase(),
        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: text),
      ),
    );
  }

  Widget _buildPriorityBadge(String priority) {
    Color color = AppColors.textMuted;
    final p = priority.toLowerCase();
    if (p == 'urgent' || p == 'high') color = AppColors.error;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        priority,
        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }
}

class TicketChatScreen extends StatefulWidget {
  final Map<String, dynamic> ticket;
  final Map<String, dynamic> user;

  const TicketChatScreen({super.key, required this.ticket, required this.user});

  @override
  State<TicketChatScreen> createState() => _TicketChatScreenState();
}

class _TicketChatScreenState extends State<TicketChatScreen> {
  late Map<String, dynamic> _ticket;
  List<dynamic> _messages = [];
  final _replyController = TextEditingController();
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _ticket = Map<String, dynamic>.from(widget.ticket);
    final rawMsgs = _ticket['messages'];
    if (rawMsgs is List) {
      _messages = List<dynamic>.from(rawMsgs);
    }
  }

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  Future<void> _sendReply() async {
    final msg = _replyController.text.trim();
    if (msg.isEmpty) return;

    final ticketId = int.tryParse(_ticket['id']?.toString() ?? '0') ?? 0;
    setState(() => _sending = true);

    try {
      final res = await SupportService.replyTicket(ticketId, message: msg);
      if (mounted) {
        _replyController.clear();
        if (res['ticket'] != null && res['ticket']['messages'] is List) {
          setState(() {
            _messages = List<dynamic>.from(res['ticket']['messages'] as List);
          });
        } else {
          setState(() {
            _messages.add({
              'sender_type': 'user',
              'message': msg,
              'created_at': DateTime.now().toIso8601String(),
            });
          });
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final code = _ticket['ticket_code'] ?? 'TK-00';
    final subject = _ticket['subject'] ?? 'Support Ticket';
    final desc = _ticket['description'] ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(code, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700)),
            Text(
              subject,
              style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Original Description Card
          if (desc.isNotEmpty)
            Container(
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ticket Subject & Issue:',
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary),
                  ),
                  const SizedBox(height: 4),
                  Text(desc, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textHeading)),
                ],
              ),
            ),

          // Discussion Messages Thread
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Text('No replies yet on this ticket.', style: GoogleFonts.inter(color: AppColors.textMuted, fontSize: 12)),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: _messages.length,
                    itemBuilder: (ctx, idx) {
                      final m = _messages[idx] is Map<String, dynamic> ? _messages[idx] : Map<String, dynamic>.from(_messages[idx] as Map);
                      final isUser = m['sender_type'] == 'user' || m['sender'] == 'user';
                      final text = m['message']?.toString() ?? '';
                      final date = m['created_at']?.toString().split('T').first ?? '';

                      return Align(
                        alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
                          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                          decoration: BoxDecoration(
                            color: isUser ? AppColors.primary : Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: isUser ? AppColors.primary : AppColors.cardBorder),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isUser ? 'You' : 'Vyapar Support Team',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: isUser ? const Color(0xFFCBD5E1) : AppColors.secondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                text,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: isUser ? Colors.white : AppColors.textHeading,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Align(
                                alignment: Alignment.bottomRight,
                                child: Text(
                                  date,
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    color: isUser ? Colors.white70 : AppColors.textLight,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Reply Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.cardBorder)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _replyController,
                      decoration: InputDecoration(
                        hintText: 'Type your message or query...',
                        hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textLight),
                        border: InputBorder.none,
                        isDense: true,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: _sending
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.send_rounded, color: AppColors.primary),
                    onPressed: _sending ? null : _sendReply,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
