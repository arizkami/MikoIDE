export const menus = [
  {
    id: "file",
    label: "File",
    items: [
      { label: "New File", command: "file.newFile" },
      { label: "New Window", command: "file.newWindow" },
      { type: "separator" },
      { label: "Open File...", command: "file.openFile" },
      { label: "Open Folder...", command: "file.openFolder" },
      { label: "Open Workspace...", command: "file.openWorkspace" },
      { type: "separator" },
      { label: "Save", command: "file.save" },
      { label: "Save As...", command: "file.saveAs" },
      { label: "Save All", command: "file.saveAll" },
      { type: "separator" },
      { label: "Close Editor", command: "file.closeEditor" },
      { label: "Close Folder", command: "file.closeFolder" },
      { label: "Close Window", command: "file.closeWindow" },
      { type: "separator" },
      { label: "Exit", command: "file.exit" }
    ]
  },
  {
    id: "edit",
    label: "Edit",
    items: [
      { label: "Undo", command: "edit.undo" },
      { label: "Redo", command: "edit.redo" },
      { type: "separator" },
      { label: "Cut", command: "edit.cut" },
      { label: "Copy", command: "edit.copy" },
      { label: "Paste", command: "edit.paste" },
      { label: "Delete", command: "edit.delete" },
      { type: "separator" },
      { label: "Find", command: "edit.find" },
      { label: "Replace", command: "edit.replace" },
      { type: "separator" },
      { label: "Select All", command: "edit.selectAll" }
    ]
  },
  {
    id: "view",
    label: "View",
    items: [
      { label: "Command Palette...", command: "view.commandPalette" },
      { type: "separator" },
      { label: "Explorer", command: "view.explorer" },
      { label: "Search", command: "view.search" },
      { label: "Source Control", command: "view.scm" },
      { label: "Run & Debug", command: "view.debug" },
      { label: "Extensions", command: "view.extensions" },
      { type: "separator" },
      { label: "Output", command: "view.output" },
      { label: "Problems", command: "view.problems" },
      { label: "Terminal", command: "view.terminal" },
      { type: "separator" },
      { label: "Appearance", submenu: [
          { label: "Toggle Full Screen", command: "view.fullScreen" },
          { label: "Zen Mode", command: "view.zenMode" },
          { label: "Toggle Panel", command: "view.togglePanel" }
        ] 
      }
    ]
  },
  {
    id: "go",
    label: "Go",
    items: [
      { label: "Back", command: "go.back" },
      { label: "Forward", command: "go.forward" },
      { type: "separator" },
      { label: "Go to File...", command: "go.gotoFile" },
      { label: "Go to Symbol...", command: "go.gotoSymbol" },
      { label: "Go to Definition", command: "go.gotoDefinition" },
      { label: "Go to Line...", command: "go.gotoLine" }
    ]
  },
  {
    id: "run",
    label: "Run",
    items: [
      { label: "Start Debugging", command: "run.startDebugging" },
      { label: "Run Without Debugging", command: "run.withoutDebugging" },
      { label: "Stop Debugging", command: "run.stop" },
      { type: "separator" },
      { label: "Open Configurations", command: "run.configurations" }
    ]
  },
  {
    id: "terminal",
    label: "Terminal",
    items: [
      { label: "New Terminal", command: "terminal.new" },
      { label: "Split Terminal", command: "terminal.split" },
      { label: "Kill Terminal", command: "terminal.kill" }
    ]
  },
  {
    id: "help",
    label: "Help",
    items: [
      { label: "Welcome", command: "help.welcome" },
      { label: "Documentation", command: "help.docs" },
      { label: "Release Notes", command: "help.releaseNotes" },
      { type: "separator" },
      { label: "Report Issue", command: "help.reportIssue" },
      { label: "About MikoIDE", command: "help.about" }
    ]
  }
]
