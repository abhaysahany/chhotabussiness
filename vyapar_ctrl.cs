using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using System.IO;

public class VyaparCtrl {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool CloseDesktop(IntPtr hDesktop);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")]
    public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")]
    public static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);
    [DllImport("user32.dll")]
    public static extern IntPtr GetDC(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateCompatibleDC(IntPtr hdc);
    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateCompatibleBitmap(IntPtr hdc, int nWidth, int nHeight);
    [DllImport("gdi32.dll")]
    public static extern IntPtr SelectObject(IntPtr hdc, IntPtr hgdiobj);
    [DllImport("gdi32.dll")]
    public static extern bool DeleteDC(IntPtr hdc);
    [DllImport("gdi32.dll")]
    public static extern bool DeleteObject(IntPtr hObject);

    [StructLayout(LayoutKind.Sequential)]
    public struct INPUT {
        public uint type;
        public MOUSEINPUT mi;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct KEYINPUT {
        public uint type;
        public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct MOUSEINPUT {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public UIntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct KEYBDINPUT {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public UIntPtr dwExtraInfo;
    }

    public const uint INPUT_MOUSE = 0;
    public const uint INPUT_KEYBOARD = 1;

    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP   = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP   = 0x0010;
    public const uint MOUSEEVENTF_WHEEL    = 0x0800;

    public const uint KEYEVENTF_KEYUP = 0x0002;

    public static readonly IntPtr HWND_TOP = (IntPtr)0;
    public const int SW_MAXIMIZE = 3;
    public const int SW_RESTORE = 9;

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int X; public int Y; public POINT(int x, int y) { X = x; Y = y; } }

    public static IntPtr FindVyapar(IntPtr hDesk) {
        IntPtr vyaparHwnd = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(256);
            GetWindowText(hWnd, sb, 256);
            if (sb.ToString().Contains("VyaparApp")) {
                vyaparHwnd = hWnd;
                return false;
            }
            return true;
        }, IntPtr.Zero);
        return vyaparHwnd;
    }

    public static void Capture(IntPtr hwnd, string outPath) {
        RECT r;
        GetWindowRect(hwnd, out r);
        int width = r.Right - r.Left;
        int height = r.Bottom - r.Top;

        IntPtr hdcSrc = GetDC(hwnd);
        IntPtr hdcDest = CreateCompatibleDC(hdcSrc);
        IntPtr hBitmap = CreateCompatibleBitmap(hdcSrc, width, height);
        IntPtr hOld = SelectObject(hdcDest, hBitmap);

        PrintWindow(hwnd, hdcDest, 2);

        Bitmap bmp = Image.FromHbitmap(hBitmap);
        string dir = Path.GetDirectoryName(outPath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) {
            Directory.CreateDirectory(dir);
        }
        if (File.Exists(outPath)) File.Delete(outPath);
        bmp.Save(outPath, ImageFormat.Png);
        bmp.Dispose();

        SelectObject(hdcDest, hOld);
        DeleteObject(hBitmap);
        DeleteDC(hdcDest);
        ReleaseDC(hwnd, hdcSrc);
    }

    public static void SendMouse(uint flags, uint mouseData = 0) {
        INPUT[] inputs = new INPUT[1];
        inputs[0].type = INPUT_MOUSE;
        inputs[0].mi.dwFlags = flags;
        inputs[0].mi.mouseData = mouseData;
        uint res = SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
        if (res == 0) {
            Console.WriteLine("SendInput failed: " + Marshal.GetLastWin32Error());
        }
    }

    public static void SendKey(ushort vk, bool up = false) {
        KEYINPUT[] inputs = new KEYINPUT[1];
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].ki.wVk = vk;
        inputs[0].ki.dwFlags = up ? KEYEVENTF_KEYUP : 0;
        // Marshal KEYINPUT as INPUT
        IntPtr ptr = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(KEYINPUT)));
        Marshal.StructureToPtr(inputs[0], ptr, false);
        INPUT inp = (INPUT)Marshal.PtrToStructure(ptr, typeof(INPUT));
        Marshal.FreeHGlobal(ptr);

        INPUT[] inps = new INPUT[] { inp };
        SendInput(1, inps, Marshal.SizeOf(typeof(INPUT)));
    }

    public static int Main(string[] args) {
        if (args.Length == 0) {
            Console.WriteLine("Usage: vyapar_ctrl <command> [args...]");
            return 1;
        }

        string cmd = args[0].ToLower();
        int exitCode = 0;

        Thread t = new Thread(() => {
            IntPtr hDesk = OpenDesktop("default", 0, false, 0x01FF);
            if (hDesk == IntPtr.Zero) {
                Console.WriteLine("Error: Failed to open default desktop: " + Marshal.GetLastWin32Error());
                exitCode = 2;
                return;
            }
            SetThreadDesktop(hDesk);

            IntPtr hwnd = FindVyapar(hDesk);
            if (hwnd == IntPtr.Zero) {
                Console.WriteLine("Error: Vyapar window not found");
                CloseDesktop(hDesk);
                exitCode = 3;
                return;
            }

            RECT r;
            GetWindowRect(hwnd, out r);

            if (cmd == "info") {
                RECT cr;
                GetClientRect(hwnd, out cr);
                Console.WriteLine("Vyapar HWND: " + hwnd);
                Console.WriteLine("Window Rect: (" + r.Left + "," + r.Top + ") " + (r.Right-r.Left) + "x" + (r.Bottom-r.Top));
                Console.WriteLine("Client Rect: " + (cr.Right-cr.Left) + "x" + (cr.Bottom-cr.Top));
            }
            else if (cmd == "bring_to_front") {
                ShowWindow(hwnd, SW_MAXIMIZE);
                SetWindowPos(hwnd, HWND_TOP, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040);
                BringWindowToTop(hwnd);
                bool sfw = SetForegroundWindow(hwnd);
                Console.WriteLine("BringToFront: " + sfw);
            }
            else if (cmd == "capture") {
                string path = args.Length > 1 ? args[1] : "capture.png";
                Capture(hwnd, path);
                Console.WriteLine("Saved capture to " + path + " (" + (new FileInfo(path)).Length + " bytes)");
            }
            else if (cmd == "click" || cmd == "rclick" || cmd == "double_click") {
                if (args.Length < 3) {
                    Console.WriteLine("Usage: click <clientX> <clientY> [delayMs] [outPath]");
                    CloseDesktop(hDesk);
                    exitCode = 4;
                    return;
                }
                int cx = int.Parse(args[1]);
                int cy = int.Parse(args[2]);
                int delay = args.Length > 3 ? int.Parse(args[3]) : 800;
                string outPath = args.Length > 4 ? args[4] : null;

                ShowWindow(hwnd, SW_MAXIMIZE);
                SetForegroundWindow(hwnd);
                Thread.Sleep(50);

                POINT pt = new POINT(cx, cy);
                ClientToScreen(hwnd, ref pt);
                int sx = pt.X;
                int sy = pt.Y;

                SetCursorPos(sx, sy);
                Thread.Sleep(50);

                if (cmd == "click") {
                    SendMouse(MOUSEEVENTF_LEFTDOWN);
                    Thread.Sleep(50);
                    SendMouse(MOUSEEVENTF_LEFTUP);
                } else if (cmd == "rclick") {
                    SendMouse(MOUSEEVENTF_RIGHTDOWN);
                    Thread.Sleep(50);
                    SendMouse(MOUSEEVENTF_RIGHTUP);
                } else if (cmd == "double_click") {
                    SendMouse(MOUSEEVENTF_LEFTDOWN);
                    Thread.Sleep(50);
                    SendMouse(MOUSEEVENTF_LEFTUP);
                    Thread.Sleep(100);
                    SendMouse(MOUSEEVENTF_LEFTDOWN);
                    Thread.Sleep(50);
                    SendMouse(MOUSEEVENTF_LEFTUP);
                }

                if (delay > 0) Thread.Sleep(delay);

                if (!string.IsNullOrEmpty(outPath)) {
                    Capture(hwnd, outPath);
                    Console.WriteLine("Clicked (" + cx + "," + cy + ") -> Screen (" + sx + "," + sy + "), captured to " + outPath + " (" + (new FileInfo(outPath)).Length + " bytes)");
                } else {
                    Console.WriteLine("Clicked (" + cx + "," + cy + ") -> Screen (" + sx + "," + sy + ")");
                }
            }
            else if (cmd == "key") {
                string key = args[1].ToUpper();
                int delay = args.Length > 2 ? int.Parse(args[2]) : 800;
                string outPath = args.Length > 3 ? args[3] : null;

                SetForegroundWindow(hwnd);
                Thread.Sleep(50);

                ushort vk = 0;
                if (key == "ESC") vk = 0x1B;
                else if (key == "ENTER") vk = 0x0D;
                else if (key == "TAB") vk = 0x09;
                else if (key == "DOWN") vk = 0x28;
                else if (key == "UP") vk = 0x26;
                else if (key == "LEFT") vk = 0x25;
                else if (key == "RIGHT") vk = 0x27;
                else if (key == "SPACE") vk = 0x20;
                else if (key == "BACKSPACE") vk = 0x08;

                if (vk != 0) {
                    SendKey(vk, false);
                    Thread.Sleep(50);
                    SendKey(vk, true);
                }

                if (delay > 0) Thread.Sleep(delay);
                if (!string.IsNullOrEmpty(outPath)) {
                    Capture(hwnd, outPath);
                    Console.WriteLine("Sent key " + key + ", captured to " + outPath);
                } else {
                    Console.WriteLine("Sent key " + key);
                }
            }
            else if (cmd == "scroll") {
                int cx = int.Parse(args[1]);
                int cy = int.Parse(args[2]);
                int delta = int.Parse(args[3]);
                int delay = args.Length > 4 ? int.Parse(args[4]) : 800;
                string outPath = args.Length > 5 ? args[5] : null;

                SetForegroundWindow(hwnd);
                POINT pt = new POINT(cx, cy);
                ClientToScreen(hwnd, ref pt);
                SetCursorPos(pt.X, pt.Y);
                Thread.Sleep(50);

                SendMouse(MOUSEEVENTF_WHEEL, (uint)delta);
                if (delay > 0) Thread.Sleep(delay);

                if (!string.IsNullOrEmpty(outPath)) {
                    Capture(hwnd, outPath);
                    Console.WriteLine("Scrolled " + delta + " at (" + cx + "," + cy + "), captured to " + outPath);
                }
            }

            CloseDesktop(hDesk);
        });

        t.SetApartmentState(ApartmentState.STA);
        t.Start();
        t.Join();
        return exitCode;
    }
}
