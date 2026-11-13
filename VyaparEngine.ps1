Add-Type -ReferencedAssemblies "System.Drawing.dll", "System.Windows.Forms.dll" @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.IO;

public class VyaparEngine {
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

    public const uint KEYEVENTF_KEYUP = 0x0002;

    public const uint INPUT_MOUSE = 0;
    public const uint INPUT_KEYBOARD = 1;

    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP   = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP   = 0x0010;
    public const uint MOUSEEVENTF_WHEEL    = 0x0800;

    public static readonly IntPtr HWND_TOP = (IntPtr)0;
    public const int SW_MAXIMIZE = 3;

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

    [DllImport("gdi32.dll")]
    public static extern bool BitBlt(IntPtr hdcDest, int nXDest, int nYDest, int nWidth, int nHeight, IntPtr hdcSrc, int nXSrc, int nYSrc, int dwRop);

    public static void CaptureHwnd(IntPtr hwnd, string outPath) {
        RECT r;
        GetWindowRect(hwnd, out r);
        int width = r.Right - r.Left;
        int height = r.Bottom - r.Top;

        IntPtr hdcSrc = GetDC(hwnd);
        IntPtr hdcDest = CreateCompatibleDC(hdcSrc);
        IntPtr hBitmap = CreateCompatibleBitmap(hdcSrc, width, height);
        IntPtr hOld = SelectObject(hdcDest, hBitmap);

        bool pw = PrintWindow(hwnd, hdcDest, 2);

        Bitmap bmp = Image.FromHbitmap(hBitmap);
        // Check if PrintWindow produced a blank/black/white image
        Color c1 = bmp.GetPixel(width / 2, height / 2);
        Color c2 = bmp.GetPixel(100, 100);
        bool isBlank = (c1.R > 250 && c1.G > 250 && c1.B > 250 && c2.R > 250 && c2.G > 250 && c2.B > 250) ||
                       (c1.R == 0 && c1.G == 0 && c1.B == 0 && c2.R == 0 && c2.G == 0 && c2.B == 0);

        if (isBlank) {
            // Fall back to BitBlt from screen DC
            IntPtr hdcScreen = GetDC(IntPtr.Zero);
            BitBlt(hdcDest, 0, 0, width, height, hdcScreen, r.Left, r.Top, 0x00CC0020);
            ReleaseDC(IntPtr.Zero, hdcScreen);
            bmp.Dispose();
            bmp = Image.FromHbitmap(hBitmap);
        }

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

    public static string DoAction(string action, int x, int y, int delta, int delayMs, string outPath) {
        string status = "";
        Thread t = new Thread(() => {
            IntPtr hDesk = OpenDesktop("default", 0, false, 0x01FF);
            if (hDesk == IntPtr.Zero) {
                status = "OpenDesktop failed: " + Marshal.GetLastWin32Error();
                return;
            }
            SetThreadDesktop(hDesk);

            IntPtr hwnd = FindVyapar(hDesk);
            if (hwnd == IntPtr.Zero) {
                status = "Vyapar window not found";
                CloseDesktop(hDesk);
                return;
            }

            ShowWindow(hwnd, SW_MAXIMIZE);
            SetForegroundWindow(hwnd);
            Thread.Sleep(50);

            POINT pt = new POINT(x, y);
            ClientToScreen(hwnd, ref pt);

            if (action == "click") {
                SetCursorPos(pt.X, pt.Y);
                Thread.Sleep(100);
                INPUT[] down = new INPUT[1];
                down[0].type = INPUT_MOUSE;
                down[0].mi.dwFlags = MOUSEEVENTF_LEFTDOWN;
                SendInput(1, down, Marshal.SizeOf(typeof(INPUT)));
                Thread.Sleep(120);
                INPUT[] up = new INPUT[1];
                up[0].type = INPUT_MOUSE;
                up[0].mi.dwFlags = MOUSEEVENTF_LEFTUP;
                SendInput(1, up, Marshal.SizeOf(typeof(INPUT)));
                status = "clicked at (" + pt.X + "," + pt.Y + ")";
            } else if (action == "key") {
                ushort vk = (ushort)x; // vk code in x
                KEYINPUT[] inps = new KEYINPUT[2];
                inps[0].type = INPUT_KEYBOARD;
                inps[0].ki.wVk = vk;
                inps[0].ki.dwFlags = 0;
                inps[1].type = INPUT_KEYBOARD;
                inps[1].ki.wVk = vk;
                inps[1].ki.dwFlags = KEYEVENTF_KEYUP;

                // marshal to INPUT
                INPUT[] inputs = new INPUT[2];
                for (int i = 0; i < 2; i++) {
                    IntPtr p = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(KEYINPUT)));
                    Marshal.StructureToPtr(inps[i], p, false);
                    inputs[i] = (INPUT)Marshal.PtrToStructure(p, typeof(INPUT));
                    Marshal.FreeHGlobal(p);
                }
                uint sent = SendInput(2, inputs, Marshal.SizeOf(typeof(INPUT)));
                status = "key sent=" + sent;
            } else if (action == "scroll") {
                SetCursorPos(pt.X, pt.Y);
                Thread.Sleep(50);
                INPUT[] inputs = new INPUT[1];
                inputs[0].type = INPUT_MOUSE;
                inputs[0].mi.dwFlags = MOUSEEVENTF_WHEEL;
                inputs[0].mi.mouseData = (uint)delta;
                SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
            } else if (action == "move") {
                SetCursorPos(pt.X, pt.Y);
            }

            if (delayMs > 0) Thread.Sleep(delayMs);

            if (!string.IsNullOrEmpty(outPath)) {
                CaptureHwnd(hwnd, outPath);
            }

            CloseDesktop(hDesk);
            if (string.IsNullOrEmpty(status)) status = "Success";
        });
        t.SetApartmentState(ApartmentState.STA);
        t.Start();
        t.Join();
        return status;
    }
}
"@ -ErrorAction SilentlyContinue

function Invoke-VyaparClick {
    param([int]$X, [int]$Y, [int]$Delay=800, [string]$OutFile="")
    [VyaparEngine]::DoAction("click", $X, $Y, 0, $Delay, $OutFile)
}

function Invoke-VyaparKey {
    param([int]$Vk, [int]$Delay=800, [string]$OutFile="")
    [VyaparEngine]::DoAction("key", $Vk, 0, 0, $Delay, $OutFile)
}

function Invoke-VyaparScroll {
    param([int]$X, [int]$Y, [int]$Delta, [int]$Delay=800, [string]$OutFile="")
    [VyaparEngine]::DoAction("scroll", $X, $Y, $Delta, $Delay, $OutFile)
}

function Get-VyaparScreen {
    param([string]$OutFile)
    [VyaparEngine]::DoAction("capture", 0, 0, 0, 100, $OutFile)
}
