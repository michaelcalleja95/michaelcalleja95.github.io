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

        loadConfig(contents)

    };
    reader.readAsText(file);
}

function loadConfig(contents)
{
    configList=JSON.parse(contents);
    console.log(configList);
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
    for(var i =0;i<configList.sharedVariables.length;i++)
    {
        createSharedVariable(configList.sharedVariables[i].name,parseInt(configList.sharedVariables[i].value));
    }

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
                    process.nextCPUCycle = parseInt(configList.tau0);
                    process.lastCPUCycle = 0;
                    process.waitingTime = 0;

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
                    row.insertCell(9);
                    row.insertCell(10);
                    row.insertCell(11);
                    row.insertCell(12);

                    //sets process's pc to the end of the memory
                    for(var k = 0; k < process.instructions.length; k++) {
                        //sets base register for start location of the process which is the address of the first instruction in the
                        //code segment. Also sets PC for this process to the first instruction
                        if (k == 0) {
                            process.baseRegister = endPointer;
                            process.pc = endPointer;
                        }

                        if(process.instructions[k][0] ==="/" && process.instructions[k][1] ==="/")
                        {
                            instructionsInMemory.push({
                                "instruction": process.instructions[k].substr(2),
                                "process": process.id,
                                "isComment": true
                            });
                        }
                        else
                        {
                            //sets pc to the location of the first instruction of this process
                            instructionsInMemory.push({
                                "instruction": process.instructions[k],
                                "process": process.id,
                                "address": endPointer
                            });
                            endPointer += 32;
                        }

                    }
                    //sets limit register
                    process.limitRegister = endPointer-32;
                    instructionsInMemory[instructionsInMemory.length-1].finalInstruction = true;

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
