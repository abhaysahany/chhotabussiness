import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';

class BrandLogo extends StatelessWidget {
  final double iconSize;
  final double fontSize;
  final bool showSubtitle;
  final bool isDarkBackground;

  const BrandLogo({
    super.key,
    this.iconSize = 42,
    this.fontSize = 20,
    this.showSubtitle = true,
    this.isDarkBackground = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Squircle Icon Badge
        Container(
          width: iconSize,
          height: iconSize,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(iconSize * 0.28),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF0F4C81),
                Color(0xFF1E3A5F),
              ],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F4C81).withValues(alpha: 0.25),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Icon(
            Icons.apartment_rounded,
            color: Colors.white,
            size: iconSize * 0.55,
          ),
        ),
        const SizedBox(width: 10),

        // Brand Typography
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'CHHOTA',
                  style: GoogleFonts.poppins(
                    fontSize: fontSize,
                    fontWeight: FontWeight.w900,
                    color: isDarkBackground ? Colors.white : AppColors.primary,
                    letterSpacing: -0.5,
                    height: 1.1,
                  ),
                ),
                Text(
                  'BUSINESS',
                  style: GoogleFonts.poppins(
                    fontSize: fontSize,
                    fontWeight: FontWeight.w900,
                    color: AppColors.secondary,
                    letterSpacing: -0.5,
                    height: 1.1,
                  ),
                ),
              ],
            ),
            if (showSubtitle)
              Text(
                'BUSINESS PROMOTER NETWORK',
                style: GoogleFonts.inter(
                  fontSize: fontSize * 0.38,
                  fontWeight: FontWeight.w700,
                  color: isDarkBackground
                      ? const Color(0xFF94A3B8)
                      : AppColors.textMuted,
                  letterSpacing: 0.8,
                ),
              ),
          ],
        ),
      ],
    );
  }
}
