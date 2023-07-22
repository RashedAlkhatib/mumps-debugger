# Language Debugger for Mumps Programming Language

This is an extention that allows you to code and debug Mumps using VS Code

## Using mumps-debugger
* Watch Video [Video](https://github.com/RashedAlkhatib/mumps-debugger/blob/main/MumpsDebug-Rashed-tutorial.webm) **Highly Recommended**
* install the Docker Image from here [GT.M Docker](https://github.com/RashedAlkhatib/GT.M-Docker) **Highly Recommended**
* Install the [Remote - SSH](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh) extension in VS Code.
* Install the **Mumps Debugger** extension in VS Code.
* Put the MDEBUG.m Routine in your M-Program-Directory and start it.
* Edit the launch.json and set routine path(localRoutinesPath) where GT.M is linked to ALSO **NOTE MDEBUG.m must be installed on your GTM server**.
* Open a M-Program you want to debug in VS Code and start debugging via "F5"

If you don't want some or all variables to be checked you can change this in Settings->Settings->Extensions->mumps-debug
Example: Variables Y,Y1,YDATE,X are constants you don't want to NEW
you put in the settings above: ``Y.*,X``
If you want to disable this check only in one file, just add a comment line: ``;ignoreVars:abc,def.*``

If you discover problems please send a bug report on the github-page.

## Project Page:

[Mumps Debugger](https://github.com/RashedAlkhatib/mumps-debugger.git)

## launch.json:

A possible `launch.json` could look like this:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "mumps",
      "request": "launch",
      "name": "Debug active File",
      "program": "${file}",
      "stopOnEntry": true,
      "localRoutinesPath": "/home/vista/EHR/r/"
    }
  ]
}
