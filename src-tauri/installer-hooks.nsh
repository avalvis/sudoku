!include "WinVer.nsh"

; Rename migration for the previous per-user NSIS releases. Their uninstaller
; preserves application data in update mode; the bundle identifier is unchanged.
!macro NSIS_HOOK_PREINSTALL
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_OK|MB_ICONSTOP "Sudoku requires Windows 10 or later."
    Abort
  ${EndIf}
  ReadRegStr $R7 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Editorial Sudoku" "Publisher"
  ReadRegStr $R8 HKCU "Software\editorial\Editorial Sudoku" ""
  ${If} $R7 == "editorial"
  ${AndIf} $R8 != ""
    IfFileExists "$R8\editorial-sudoku.exe" 0 sudoku_legacy_done
    IfFileExists "$R8\uninstall.exe" 0 sudoku_legacy_done
    DetailPrint "Updating Editorial Sudoku to Sudoku..."
    ExecWait '"$R8\uninstall.exe" /S /UPDATE _?=$R8' $R9
    ${If} $R9 != 0
      MessageBox MB_OK|MB_ICONSTOP "Close Editorial Sudoku and try the installation again."
      Abort
    ${EndIf}
    IfFileExists "$R8\editorial-sudoku.exe" 0 sudoku_legacy_done
    MessageBox MB_OK|MB_ICONSTOP "The previous installation could not be removed. Close the application and try again."
    Abort
  ${EndIf}
  sudoku_legacy_done:
!macroend
