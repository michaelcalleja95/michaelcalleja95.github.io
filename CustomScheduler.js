/**
 * Function which decides which instruction to schedule by looking at the state of its current process
 * and possibly deciding the ew process to schedule.
 */
Sim.Facility.prototype.customScheduler = function () {
    if (this.maxqlen === 0 && !this.free || this.maxqlen > 0 && this.queue.size() >= this.maxqlen)
        instruction.msg = -1, instruction.deliverAt = instruction.entity.time(), instruction.entity.sim.queue.insert(instruction);
    else {

        //preempts if necessary
        if(timeSliceCounter >=parseInt(document.getElementById('timeSlice').value)
            && document.getElementById("algorithmSelection").value ==="RR"|| preempted ===true ||
            currentlyExecutingProcess.state === "WAIT")
            preempt();

        //schedules a new process if no process is scheduled or the previous one has now terminated or preemption has occured
        //pc is set inside the function
        if(currentlyExecutingInstruction==="" || currentlyExecutingProcess.state === "TERMINATED" || preempted === true)
            scheduleNewProcess();

        //if unable to schedule a process;
        if(currentlyExecutingProcess==="")
            return;

        //Memory Managment
        if(currentlyExecutingProcess.pc>currentlyExecutingProcess.limitRegister
            || currentlyExecutingProcess.pc<currentlyExecutingProcess.baseRegister)
        {
            //alert("exceeded memory bounds of the process");
            return;
        }

        //loops through memory to find the insruction at a particular location value equal to PC
        for(var j=0;j<instructionsInMemory.length;j++)
        {
            currentlyExecutingInstruction = "";
            if(instructionsInMemory[j].address === currentlyExecutingProcess.pc)
            {
                currentlyExecutingInstruction = instructionsInMemory[j];
                break;
            }
        }
        //the instruction is passed towards the cpu queue
        if(currentlyExecutingInstruction!=="")
        {
            for(var j=0;j<instructionList.length;j++)
            {
                var lexemes = currentlyExecutingInstruction.instruction.split(" ");
                 if(lexemes[0].replace(/\s+/g, '') === instructionList[j].name)
                 {
                     var request = new Sim.MyRequest(this,sim.time(),0, currentlyExecutingInstruction, instructionList[j].cycles);
                     request.source = cpu;
                     this.queue.push(request, instructionList[j].cycles);
                     this.useCustomScheduler();
                     break;
                 }
            }
        }
        //error checking to make sure an instruction is found
        else
        {
            //alert("cannot find instruction");
            currentlyExecutingInstruction="";
            currentlyExecutingProcess="";
            return;
        }
    }
};

/**
 * The cpu queue should only have this instruction in the queue and it will be set for
 * a particular duration
 */
Sim.Facility.prototype.useCustomScheduler = function () {
    for (; this.free > 0 && !this.queue.empty();) {

        var nextInstruction = this.queue.data[0];
        if(this.queue.data.length!==1)
        {
            alert("error with instruction queue");
        }
        //sim.js code to execute it for the required duration equal to the clock cycles
        this.queue.data.splice(0, 1);
        if (!nextInstruction.cancelled) {
            for (var c = 0; c < this.freeServers.length; c++)if (this.freeServers[c]) {
                this.freeServers[c] = !1;
                nextInstruction.msg = c;
                break;
            }
            this.free--;
            this.busyDuration += parseInt(nextInstruction.duration);
            nextInstruction.cancelRenegeClauses();
            c = new Sim.MyRequest(this, sim.time(), sim.time() + parseInt(nextInstruction.duration)
                , currentlyExecutingInstruction, parseInt(nextInstruction.duration));
            c.done(this.useCustomSchedulerCallback, this, nextInstruction);

            sim.queue.insert(c);

        }
    }
};

/**
 * Called when the instruction duration has finished
 * @param a
 */
Sim.Facility.prototype.useCustomSchedulerCallback = function (a) {
    this.free++;
    this.freeServers[a.msg] = !0;
    //this.stats.leave(a.scheduledAt, a.entity.time());

    //executes instruction's logic
    executeInstruction(currentlyExecutingInstruction.instruction);

    //process is now terminated if that was the last instruction
    if(currentlyExecutingProcess.pc === currentlyExecutingProcess.limitRegister)
    {
        currentlyExecutingProcess.state = "TERMINATED";
        currentlyExecutingProcess.finishTime = sim.time()-currentlyExecutingProcess.tstart;
    }

    //increments pc and process's pc
    currentlyExecutingProcess.pc+=32;

    //increments time slice counter
    for(var k=0;k<instructionList.length;k++)
    {
        var lexemes = currentlyExecutingInstruction.instruction.split(" ");

        if(lexemes[0].replace(/\s+/g, '') === instructionList[k].name)
        {
            timeSliceCounter+=parseInt(instructionList[k].cycles);
            currentlyExecutingProcess.lastCPUCycle+=parseInt(instructionList[k].cycles);
            //currentlyExecutingProcess.nextCPUCycle-=parseInt(instructionList[k].cycles);
            break;
        }
    }

    this.customScheduler();
    a.deliver()
};

/**
 * Called when the currently executing process is changed.
 * It is chosen depending on the scheduling algorithm while also possibly loading the instruction to memory
 */
function scheduleNewProcess()
{
    timeSliceCounter = 0;
    var newID=-1;
    //alert(document.getElementById("algorithmSelection").value);

    //fcfs take the next process by choosing the one that has had the most time without cpu
    if(document.getElementById("algorithmSelection").value ==="FCFS" || document.getElementById("algorithmSelection").value ==="RR")
    {
        var minStartTime = 10000;
        for (var i = 0; i < processControlBlock.length; i++)
        {
            if (processControlBlock[i].state ==="START" || processControlBlock[i].state ==="READY")
            {
                if(parseInt(processControlBlock[i].lastCPUTime)<minStartTime)
                {
                    minStartTime = parseInt(processControlBlock[i].lastCPUTime);
                    newID = processControlBlock[i].id;
                }
            }
        }
        if(newID==-1)
        {
            //alert("error with FCFS");
            currentlyExecutingInstruction = "";
            currentlyExecutingProcess="";
        }

    }
    //uses each process's priority value if available
    else if(document.getElementById("algorithmSelection").value ==="Priority")
    {
        var maxPriority = -1;
        for (var i = 0; i < processControlBlock.length; i++)
        {
            if (processControlBlock[i].priority!==undefined && (processControlBlock[i].state ==="READY" || processControlBlock[i].state ==="START"))
            {
                if(parseInt(processControlBlock[i].priority)>maxPriority)
                {
                    maxPriority = parseInt(processControlBlock[i].priority);
                    newID = processControlBlock[i].id;
                }
            }
        }
        //if there are no priorities, fcfs is used
        if(newID==-1)
        {
            var minStartTime = 10000;
            for (var i = 0; i < processControlBlock.length; i++)
            {
                if (processControlBlock[i].state ==="START" || processControlBlock[i].state ==="READY")
                {
                    if(parseInt(processControlBlock[i].lastCPUTime)<minStartTime)
                    {
                        minStartTime = parseInt(processControlBlock[i].lastCPUTime);
                        newID = processControlBlock[i].id;
                    }
                }
            }
            //if(newID==-1)
                //alert("error with FCFS");
        }
    }
    else if(document.getElementById("algorithmSelection").value ==="SJF")
    {
        var minCPUCycles = 10000;
        for (var i = 0; i < processControlBlock.length; i++)
        {
            if (processControlBlock[i].state ==="START" || processControlBlock[i].state ==="READY")
            {
                if(parseFloat(processControlBlock[i].nextCPUCycle)<minCPUCycles)
                {
                    minCPUCycles = parseFloat(processControlBlock[i].nextCPUCycle);
                    newID = processControlBlock[i].id;
                }
            }
        }
    }
    //user defined algorithms
    else if(document.getElementById("algorithmSelection").value ==="User Created")
    {
        newID = eval('(function() {' + configList.scheduler + '}())');
    }
    else if(document.getElementById("algorithmSelection").value ==="Runtime")
    {
        newID = parseInt(prompt("Enter Next Process ID"));
    }
    else
        alert("error choosing algorithm");

    if(newID===-1)
    {
        //alert("unable to choose a process");
        currentlyExecutingInstruction = "";
        currentlyExecutingProcess="";
        return;
    }

    preempted=false;

    //if the process is in the start state it means it is not yet loaded to memory so it is loaded and assigned
    //its base and limit registers and its pc
    for (var i = 0; i < processControlBlock.length; i++)
    {
        if(processControlBlock[i].id === newID)
        {
            if(processControlBlock[i].state !== "READY" && processControlBlock[i].state !== "START")
            {
                alert("process chosen cannot be executed");
                scheduleNewProcess();
                return;
            }
            if(processControlBlock[i].state == "START")
            {
                //sets process's pc to the end of the memory
                for(var k = 0; k < processControlBlock[i].instructions.length; k++) {
                    //sets base register for start location of the process which is the address of the first instruction in the
                    //code segment. Also sets PC for this process to the first instruction
                    if (k == 0) {
                        processControlBlock[i].baseRegister = endPointer;
                        processControlBlock[i].pc = endPointer;
                    }

                    if(processControlBlock[i].instructions[k][0] ==="/" && processControlBlock[i].instructions[k][1] ==="/")
                    {
                        instructionsInMemory.push({
                            "instruction": processControlBlock[i].instructions[k].substr(2),
                            "process": processControlBlock[i].id,
                            "isComment": true
                        });
                    }
                    else
                    {
                        //sets pc to the location of the first instruction of this process
                        instructionsInMemory.push({
                            "instruction": processControlBlock[i].instructions[k],
                            "process": processControlBlock[i].id,
                            "address": endPointer
                        });
                        endPointer += 32;
                    }

                }
                //sets limit register
                processControlBlock[i].limitRegister = endPointer-32;
                instructionsInMemory[instructionsInMemory.length-1].finalInstruction = true;
            }
            //loads process's registers
            else
            {
                if(processControlBlock[i].cpuRegisters!== undefined)
                {
                    for(var j =0; j<processControlBlock[i].cpuRegisters.length; j++)
                    {
                        for(var k=0;k<registers.length;k++)
                        {
                            if(registers[k].name === processControlBlock[i].cpuRegisters[j].name)
                            {
                                registers[k].value =processControlBlock[i].cpuRegisters[j].value;
                            }
                        }
                    }
                }
            }

            processControlBlock[i].state = "RUNNING";
            currentlyExecutingProcess = processControlBlock[i];
            currentlyExecutingProcess.waitingTime+=parseInt(sim.time()) - parseInt(currentlyExecutingProcess.lastCPUTime);
            return;
        }
    }
    //error if still not returned
    currentlyExecutingInstruction = "";
    currentlyExecutingProcess="";
    return;
}
