const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const sourceContainer = process.argv[2];
const destContainer = process.argv[3];

async function runCommand(cmd) {
  try {
    return exec(cmd);
  } catch (error) {
    throw error;
  }
}

console.log("process", process.argv);

// create a zip file of data with mongodump in the source container
// copy the zipped file from container to system
// copy zipped file from system to dest container
// to backup all of the data use mongorestore to upload it
// if all of the steps are successful -> clear the remove the temp file from src , dest , system

runCommand(
  `docker exec ${sourceContainer} bash -c "mongodump  --gzip -o /migrationRunning/db.dump"`
)
  .then(() => {
    return runCommand(
      `docker cp ${sourceContainer}:/migrationRunning/db.dump temp-data`
    );
  })
  .then(() => {
    return runCommand(`docker cp temp-data ${destContainer}:/migrationRunning`);
  })
  .then(() => {
    return runCommand(
      `docker exec ${destContainer} bash -c "mongorestore --gzip /migrationRunning"`
    );
  }).then(() => {
    console.log("Migration successful Now cleaning the cache");
    cleanData();
  })
  .catch((error) => {
    console.log(error, "error");
    process.exit(1);
  });


async function cleanData(){
  try {
    await runCommand("rm -rf temp-data");
    await runCommand(`docker exec ${sourceContainer} bash -c "rm -rf /migrationRunning"`)  
    await runCommand(`docker exec ${destContainer} bash -c "rm -rf /migrationRunning"`);
    console.log("Operation successful");
  } catch (error) {
    console.log("ERROR",error)
    console.log("Migration successful just run the file with --clean flag");
  }
}
