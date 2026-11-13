import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:userapp/screens/login_screen.dart';
import 'package:userapp/screens/register_screen.dart';
import 'package:userapp/screens/forgot_password_screen.dart';
import 'package:userapp/screens/dashboard_screen.dart';

void main() {
  testWidgets('Login screen loads correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: LoginScreen(),
      ),
    );
    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.text('Welcome back!'), findsOneWidget);
    expect(find.text('Partner Sign In'), findsOneWidget);
  });

  testWidgets('Register screen loads correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: RegisterScreen(),
      ),
    );
    expect(find.byType(RegisterScreen), findsOneWidget);
    expect(find.text('Create Partner Account'), findsOneWidget);
    expect(find.text('Register Partner'), findsOneWidget);
  });

  testWidgets('Forgot password screen loads correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: ForgotPasswordScreen(),
      ),
    );
    expect(find.byType(ForgotPasswordScreen), findsOneWidget);
    expect(find.text('Forgot Password?'), findsOneWidget);
    expect(find.text('Send Recovery OTP'), findsOneWidget);
  });

  testWidgets('Dashboard screen loads correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: DashboardScreen(
          initialUser: {
            'id': 1,
            'name': 'Rahul Sharma',
            'email': 'rahul.sharma@gmail.com',
            'user_code': 'CB100201',
            'rank': 'Gold Executive',
          },
        ),
      ),
    );
    expect(find.byType(DashboardScreen), findsOneWidget);
    expect(find.text('Rahul Sharma'), findsOneWidget);
    expect(find.text('ID: CB100201'), findsOneWidget);
  });
}
