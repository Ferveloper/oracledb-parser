'use strict';

require('console-stamp')(console, {pattern: 'dd/mm/yy HH:mm:ss'});
const oracledb = require('oracledb');
const axios = require('axios');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function run() {

  let connection, machines;

  try {
    connection = await oracledb.getConnection(  {
      user          : "IT",
      password      : "to4get",
      connectString : "10.21.34.72:1521/BarcoDB"
    });

    const result = await connection.execute(
      `select distinct c_machine_id, c_tool_id from pcms.t_jobs
      where c_seqnr = '0'`
    );
    // console.log(result.rows, result.rows.length);
    
    const machinesIds = ['I34', 'I36', 'I37', 'I41', 'I43', 'I44', 'I46', 'I49', 'I55', 'I57', 'I59', 'I60', 'I63', 'I65'];

    machines = result.rows
    .filter(machine => machinesIds.includes(machine.C_MACHINE_ID.trim()))
    .map(machine => {
      return { id: `cefa.inyectora.0${machine.C_MACHINE_ID.match(/\d+/)}`, molde: parseInt(machine.C_TOOL_ID) }
    })
    .sort((a, b) => {
      a = a.id.match(/\d+/);
      b = b.id.match(/\d+/);
      return a - b;
    });
    // console.log(machines, machines.length);

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }

  try {
    const headers = {
      'Accept': 'application/json',
      'fiware-service': 'openiot',
      'fiware-servicepath': '/'
    };

    machines.forEach(machine => {
      // console.log(`Enviando PATCH a ${machine.id}`);
      axios.patch(`http://10.21.34.206:1026/v2/entities/${machine.id}/attrs`, {
        molde: {
          "value": parseInt(machine.molde),
          "type": "Integer"
        }
      },
      { headers }
      )
      .then( response => console.log(`Entity patched | id: ${machine.id}, molde: ${machine.molde}`, response.status, response.statusText))
      .catch(err => console.log('ERROR', err.code, err.config));
    });
  } catch (err) {
    console.log('ERROR', err);
  }
}

run();
// setInvertal(run, 60000);
