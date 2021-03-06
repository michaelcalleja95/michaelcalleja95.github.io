var sim = new Sim();
var stats = new Sim.Population();
var cpu = new Sim.Facility('CPU');

var initial_start_bool = false;

var boolean_is_io_called = false;

//boolean for manual step and automated step
var boolean_stop = true;

//stores the configurations of the simulation from the JSON file
var configList = [];

//stores each instruction and their implementation and amount of clockcycles
var instructionList = [];

//always stores the current executing process and instruction for reference to avoid
//repeated searching for the current process in the processControlBlock and the current instruction in the
//instructionsInMemory array
var currentlyExecutingInstruction = "";
var currentlyExecutingProcess = "";

//used to calculate time slice for round robin as this variable will store the current time slice
var timeSliceCounter =0;

//the list of semaphores
var semaphores = [];
//createSemaphore("s1",1);
//createSemaphore("s2",1);

//the list of io devices
var devices = [];
//createDevice("device1");

//before running an instruction it checks if the current process is premepted
var preempted = false;

//arrays that will store the list of variables and the list of registers
var sharedVariables =[];
//
// sharedVariables.push({"name":"flag1", "value":0});
// sharedVariables.push({"name":"flag2", "value":0});
var registers =[];

//stores the list of instructions currently in memory with their type, size and corresponding process
var instructionsInMemory =[];

//refers to the last value of the memory currently used to assign new addresses at the end
var endPointer = 0;

var boldlist = [];
var hiddenlist = [];

/**
 * a single step to the next entry/leave event
 * afterwards visualization is done
 */
function manualStep() {
    
    //stops the automated step and calls manualStep()
    boolean_stop = true;

    //temporary assumption that IOwait will only last for 1 event
    if(boolean_is_io_called ===true)
    {
        boolean_is_io_called = false;
        iosignal("device1");
    }

    sim.step();
    if(currentlyExecutingInstruction==="")
        cpu.customScheduler();

    animate();
    if(sim.time() === 1)
        document.getElementById("helpText").innerHTML = "semaphore value is now 0 so process so process does not wait as it is not negative";
    if(sim.time() === 2)
        document.getElementById("helpText").innerHTML = "semaphore value is now negative so second process is set to waiting state";
    if(sim.time() === 6)
        document.getElementById("helpText").innerHTML = "signal sets semaphore to 0 so it puts the waiting process out of the waiting state";
    if(sim.time() === 18)
        document.getElementById("helpText").innerHTML = " ";
}

/**
 * boolean stop is set to false to allow for automatic steps
 */
function startAutomatedStep(){

    if(boolean_stop === false)
        return;
    //sets flag then starts loop
    //Issue with pressing multiple Automated steps
    //manualStep();
    if(initial_start_bool=== false)
    {
        initial_start_bool = true;
        preempt();
    }

    boolean_stop = false;
    automatedStep();
}

/**
 * goes through multiple event steps until the stop button is pressed
 * or startManualStep() is called
 */
function automatedStep() {
    if(!boolean_stop){
        //each step is similiar to the manual step

        //temporary assumption that IOwait will only last for 1 event
        if(boolean_is_io_called ===true)
        {
            boolean_is_io_called = false;
            iosignal("device1");
        }

        sim.unitStep();
        if(currentlyExecutingInstruction==="")
            cpu.customScheduler();

        //after each step the visualization needs to be updated
        animate();

        //calculates physical delay for the user depending on the delay input field using recursion
        setTimeout(function () {
            automatedStep();
        }, 1000);
    }
}

/**
 * A facility's queue is animated by drawing a square of the appropriate length for each process inluding
 * the one currently being serviced that is not  visible in the queue. Instead this value is taken from
 * the facility's busy duration.
 * Besides the process queue, instructions in memory are also updated to show where the PC is and the running process's
 * instructions
 */
function animate() {

    document.getElementById("simTime").innerHTML = sim.time();

    var tbl  = document.getElementById('pcbTable');
    var rows = tbl.getElementsByTagName('tr');

    for (var row=0; row<rows.length;row++) {
        var cels = rows[row].getElementsByTagName('td');
        if(row === 0)
        {
            for(var i =0;i<boldlist.length;i++)
            {
                cels[parseInt(boldlist[i])].style.fontWeight = 'bold';
            }
        }

        for(var i =0;i<hiddenlist.length;i++)
        {
            cels[parseInt(hiddenlist[i])].style.display="none";
        }
    }

    //animating the instructions in memory by redrawing the instructionsInMemory array
    var instructionlist = document.getElementById('memoryList');
    //first clears the list
    while(instructionlist.firstChild) {
            instructionlist.removeChild(instructionlist.firstChild);
    }
    //loops through the instructionsInMemory and changes their colour if they refer to the current executing process
    //or to the PC
    var titlerow = instructionlist.insertRow();
    var titlecell0 =titlerow.insertCell(0);
    titlecell0.innerHTML = "PID";
    var titlecell1 =titlerow.insertCell(1);
    titlecell1.style.width="10px";
    var titlecell2 =titlerow.insertCell(2);
    titlecell2.innerHTML = "instruction";

    var titlecell3 =titlerow.insertCell(3);
    titlecell3.innerHTML = "address";

    for (var i = 0; i < instructionsInMemory.length; i++) {
        var row = instructionlist.insertRow();
        var cell0 =row.insertCell(0);
        var cell1 =row.insertCell(1);
        cell1.className="firstRow";
        var cell2 =row.insertCell(2);

        if(instructionsInMemory[i].isComment !== true)
        {
            for(var j=0;j<processControlBlock.length;j++)
            {
                if(instructionsInMemory[i].address === processControlBlock[j].baseRegister)
                {
                    cell0.innerHTML = processControlBlock[j].id;
                }
            }
        }

        //comments are formatted differently
        if(instructionsInMemory[i].isComment === true)
        {
            cell2.innerHTML= instructionsInMemory[i].instruction;
            if(instructionsInMemory[i].process === currentlyExecutingInstruction.process)
                cell2.style.fontWeight= "bold";
            cell2.style.fontStyle= "italic";
            cell2.colSpan = 2;
        }
        else
        {
            var cell3 =row.insertCell(3);
            //if(instructionsInMemory[i].instruction !== "compute")
                cell2.innerHTML= instructionsInMemory[i].instruction;
            //else
            //    cell2.innerHTML= "CPU Burst of 1";

            cell3.innerHTML= instructionsInMemory[i].address.toString(16);
            if(instructionsInMemory[i].process === currentlyExecutingInstruction.process)
                cell2.style.fontWeight= "bold";
            if(instructionsInMemory[i].address === currentlyExecutingProcess.pc)
            {
                cell1.innerHTML=" &rarr;";
                cell2.style.color = 'red';
                row.id = "selectedID";
                document.getElementById("selectedID").scrollIntoView();
            }
            if(instructionsInMemory[i].finalInstruction === true)
            {
                cell1.style.borderBottomStyle= "solid";
                cell1.style.borderBottomWidth= "1px";
            }
        }
    }

    //animating the registerlist by redrawing the registerlist array
    var registerlist = document.getElementById('registerlist');
    //first clears the list
    while(registerlist.firstChild) {
        registerlist.removeChild(registerlist.firstChild);
    }
    for (var i = 0; i < registers.length; i++) {
        var item = document.createElement('li');
        item.appendChild(document.createTextNode(registers[i].name + ": "+ registers[i].value));
        registerlist.appendChild(item);
    }

    //animating the shared variable list by redrawing the shared variable list array
    var sharedvariablelist = document.getElementById('sharedvariablelist');
    //first clears the list
    while(sharedvariablelist.firstChild) {
        sharedvariablelist.removeChild(sharedvariablelist.firstChild);
    }
    for (var i = 0; i < sharedVariables.length; i++) {
        var item = document.createElement('li');
        item.appendChild(document.createTextNode(sharedVariables[i].name + ": "+ sharedVariables[i].value));
        sharedvariablelist.appendChild(item);
    }

    //animating the semaphorelist by redrawing the semaphores array
    var semaphoreList = document.getElementById('semaphoreList');
    //first clears the list
    while(semaphoreList.firstChild) {
        semaphoreList.removeChild(semaphoreList.firstChild);
    }
    for (var i = 0; i < semaphores.length; i++) {
        var item = document.createElement('li');
        item.appendChild(document.createTextNode(semaphores[i].name + ": "+ semaphores[i].value));
        semaphoreList.appendChild(item);
    }

    //animating the io devices by redrawing the devices array
    var deviceList = document.getElementById('deviceList');
    //first clears the list
    while(deviceList.firstChild) {
        deviceList.removeChild(deviceList.firstChild);
    }
    for (var i = 0; i < devices.length; i++) {
        (function(){
            var index = i;
            //var item = document.createElement('li');
            var item = document.createElement("input");
            item.type = "button";
            item.value = devices[i].name;
            item.name = devices[i].name;
            item.addEventListener('click', function(e){
                iosignal(devices[index].name);
            });

            //item.appendChild(document.createTextNode(devices[i].name));
            deviceList.appendChild(item);
        }());

    }

    // //animates PCB
    for(var i=0; i<processControlBlock.length; i++)
    {
        if(processControlBlock[i].id!==undefined)
        {
            var row =document.getElementById("row"+processControlBlock[i].id);
            if(currentlyExecutingInstruction.process === processControlBlock[i].id)
                row.style.fontWeight = "bold";
            else
                row.style.fontWeight = "normal";

            row.children[0].textContent = processControlBlock[i].id;
            row.children[1].textContent = processControlBlock[i].tstart;
            row.children[2].textContent = processControlBlock[i].finishTime;
            if(processControlBlock[i].state !== "TERMINATED");
                row.children[3].textContent = processControlBlock[i].waitingTime;
            row.children[4].textContent = processControlBlock[i].baseRegister.toString(16);;
            row.children[5].textContent = processControlBlock[i].limitRegister.toString(16);;
            row.children[6].textContent = processControlBlock[i].state;
            row.children[7].textContent = processControlBlock[i].pc.toString(16);;
            row.children[8].textContent = processControlBlock[i].lastCPUTime;

            row.children[10].textContent = processControlBlock[i].priority;
            row.children[11].textContent = processControlBlock[i].nextCPUCycle;
            row.children[12].textContent = processControlBlock[i].lastCPUCycle;

            if(processControlBlock[i].cpuRegisters!==undefined)
            {
                var registersString ="";
                for(var j=0;j<processControlBlock[i].cpuRegisters.length;j++)
                {
                    registersString += processControlBlock[i].cpuRegisters[j].name;
                    registersString += ": ";
                    registersString += processControlBlock[i].cpuRegisters[j].value;
                    if(j!== processControlBlock[i].cpuRegisters.length-1)
                        registersString+= ",";
                }

                row.children[9].textContent = registersString;
            }
        }
    }
}

function myFunction() {
    location.reload();
}