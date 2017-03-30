//actual process list
var processControlBlock= [];
//used to give automatic ids to processes
var pid =0;

function createJSON(object,data,name) {
    var obj = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    object.setAttribute("href", "data:"+obj);
    object.setAttribute("download", name+".json");
}

/**
 * Reads a configuration JSON file and stores it to configList
 * @param e
 */
function  readConfigFromFile(e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        // Display file content
        console.log(contents);
        configList=JSON.parse(contents);
        document.getElementById("userCreated").value = configList.scheduler;
        document.getElementById("algorithmSelection").value = configList.choice;

        for(var i =0;i<configList.devices.length;i++)
        {
            createDevice(configList.devices[i]);
        }
        for(var i =0;i<configList.semaphores.length;i++)
        {
            createSemaphore(configList.semaphores[i].name,parseInt(configList.semaphores[i].value));
        }
    };
    reader.readAsText(file);
}

/**
 * Reads a process list JSON file and calls displayContents which will handle it
 * @param e
 */
function readProcessesFromFile(e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        // Display file content
        displayContents(contents);
    };
    reader.readAsText(file);
}

/**
 * parses the JSON file to the processControlBlock and passes it to the simulator
 * @param contents
 */
function displayContents(contents) {
    //fills all PCB data to processControlBlock
    processControlBlock = JSON.parse(contents);

    //adds the new process row to the process table
    var table = document.getElementById("pcbTable");

    //for each process, required values are set and it is passed to the simulation library
    for(var i =0; i<processControlBlock.length; i++)
    {
        //if start time is undefined by user it is automatically set to 0
        if(processControlBlock[i].tstart===undefined)
            processControlBlock[i].tstart = 0;

            var InstructionScheduler ={
                start: function () {;
                    var process = processControlBlock[i];
                    //its required values are only set once its start time is set
                    this.setTimer(parseInt(processControlBlock[i].tstart)).done(function(){
                        this.service(process);
                    });
                },
                service: function (process) {

                    //framework decides Process id for each process
                    //also sets its initial state to start
                    process.id = pid;
                    pid++;
                    //initial state set to start
                    process.state = "START";
                    process.lastCPUTime = process.tstart;
                    process.nextCPUCycle = 10;
                    process.lastCPUCycle = 0;

                    //creates row for each table
                    var row = table.insertRow();
                    row.id = "row"+process.id;
                    row.insertCell(0);
                    row.insertCell(1);
                    row.insertCell(2);
                    row.insertCell(3);
                    row.insertCell(4);
                    row.insertCell(5);
                    row.insertCell(6);
                    row.insertCell(7);
                    row.insertCell(8);
                    animate();
                }
            };
            sim.addEntity(InstructionScheduler);
    }
}

/**
 * Reads an instruction set JSON file and stores it to instructionList
 * @param e
 */
function  readInstructionsFromFile(e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        instructionList=JSON.parse(contents);
        populateInstructionList();
        displayInstructionImplementation();
    };
    reader.readAsText(file);
}

document.getElementById('process-input').addEventListener('change', readProcessesFromFile, false);
document.getElementById('config-input').addEventListener('change', readConfigFromFile, false);
document.getElementById('instruction-definitions').addEventListener('change', readInstructionsFromFile, false);
