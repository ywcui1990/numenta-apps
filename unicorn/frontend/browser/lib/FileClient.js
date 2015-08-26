/* -----------------------------------------------------------------------------
 * Copyright © 2015, Numenta, Inc. Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for
 * more details.
 *
 * You should have received a copy of the GNU Affero Public License along with
 * this program. If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * -------------------------------------------------------------------------- */

'use strict';


/**
 * Unicorn: FileClient - talk to a FileServer somewhere (over IPC or HTTP),
 *  which has access to Node/io.js layer of filesystem, so we can CRUD files.
 */

// externals

// internals


// ADAPTERS

class FileClientAdapter {
}

class FileClientAdapterHTTP extends FileClientAdapter {
}

class FileClientAdapterIPC extends FileClientAdapter {
  constructor(ipcStream) {
    super();
    this.ipc = ipcStream;
  }
}


// MAIN

class FileClient {
  static Adapter = {
    HTTP: FileClientAdapterHTTP,
    IPC:  FileClientAdapterIPC
  };

  constructor(adapter) {
    if(! adapter instanceof FileClientAdapter) {
      throw new Error('FileClient receieved an invalid Adapter object.');
    }
    this.adapter = adapter;
  }

  getFiles(callback) {
    let error = null;
    if(error) callback(error, null);
    callback(
      null,
      [ 'fileUno.csv', 'fileDos.csv', 'fileTres.csv' ]
    );
    return;
  }
}

export default FileClient;


/*

  // @TODO how to switch to HTTP adapter correctly here? sync: README.md todos
  // let fileClientAdapter = new FileClient.Adapter.HTTP();
  let fileClientAdapter = new FileClient.Adapter.IPC(ipcFileStream);
  let fileClient = new FileClient(fileClientAdapter);
  fileClient.getFiles((error, files) => {
    if(error) throw new Error(error);
    console.log('Files!', files);
  });

  // IPC stream examples: -------------------
  ipcFileStream.on('data', (chunk) => {
    console.log('chunk', chunk);
  });
  ipcFileStream.on('end', () => {});
  // ipcFile.write({ test: 'from-renderer-to-main' });
  // ipcFile.end();
    // ReadableStream.pipe(WriteableStream);
    // FaucetAbove.pipe(DownDrain);

*/
