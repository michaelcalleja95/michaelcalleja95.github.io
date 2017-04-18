/**
 * Preemption sets process to ready
 */
function preempt()
{
    timeSliceCounter=0;
    preempted=true;
    currentlyExecutingProcess.lastCPUTime = sim.time();

    if(currentlyExecutingProcess.pc-32 === currentlyExecutingProcess.limitRegister && currentlyExecutingProcess.state !== "WAIT")
    {
        currentlyExecutingProcess.state = "TERMINATED";
        currentlyExecutingProcess.finishTime = sim.time()-currentlyExecutingProcess.tstart;
    }
    else
    {
        //if it was not interrupted by a wait
        if(currentlyExecutingProcess.state !== "WAIT")
            currentlyExecutingProcess.state = "READY";
        var tempRegisters =[];
        for(var i=0; i<registers.length;i++)
        {
            var index = {"name":registers[i].name,"value":registers[i].value};
            tempRegisters.push(index);
        }
        currentlyExecutingProcess.cpuRegisters = tempRegisters;
    }
}

/**
 * Jump simply changes the pc while checking that it is still within the memory range of the process
 * @param address
 */
function jump(address)
{
    currentlyExecutingProcess.pc = currentlyExecutingProcess.baseRegister+parseInt(address)-32;
    if(currentlyExecutingProcess.pc>currentlyExecutingProcess.limitRegister
        || currentlyExecutingProcess.pc<currentlyExecutingProcess.baseRegister-32)
        alert("exceeded memory bounds of the process");
}

/**
 * end process terminates the process
 */
function endprocess()
{
    currentlyExecutingProcess.state = "TERMINATED";
    currentlyExecutingProcess.finishTime = sim.time()-currentlyExecutingProcess.tstart;
}

function createSharedVariable(name, value)
{
    var found = false;
    //loops to check if it already exists
    for(var i =0;i<sharedVariables.length;i++)
    {
        if(name === sharedVariables[i].name)
        {
            found = true;
            break;
        }
    }
    if(found === false)
        sharedVariables.push({"name":name, "value":parseInt(value)});
    else
        alert("shared variable already exists");
}

/**
 * Creates semaphore of a specified value if it does not already exist
 * @param semaphore
 * @param value
 */
function createSemaphore(semaphore, value)
{
    if(parseInt(value)<1)
        alert("invalid semaphore value");
    var found = false;
    //loops to check if it already exists
    for(var i =0;i<semaphores.length;i++)
    {
        if(semaphore === semaphore[i].name)
        {
            found = true;
            break;
        }
    }
    if(found === false)
        semaphores.push({"name":semaphore, "value":parseInt(value), "processList":[]});
    else
        alert("semaphore already exists");
}

/**
 * If semaphore exists it decrements its value and if it is negative it
 * means that this process must wait and it is pushed to the wait queue
 * @param s
 */
function wait(s)
{
    var found = false;
    for(var i =0;i<semaphores.length;i++)
    {
        if(s === semaphores[i].name)
        {
            found = true;
            semaphores[i].value-=1;
            if(semaphores[i].value<0)
            {
                semaphores[i].processList.push(currentlyExecutingProcess);
                currentlyExecutingProcess.state = "WAIT"; //block()
            }
            break;
        }
    }
    if(found === false)
    {
        alert("could not find semaphore");
    }
}

/**
 * Increments the semaphore if it exists as the critical section has ended
 * If the queue is negative or 0 it means a process is waiting for this semaphore
 * so its first entry in the queue is popped.
 * @param s
 */
function signal(s)
{
    var found = false;
    for(var i =0;i<semaphores.length;i++)
    {
        if(s === semaphores[i].name)
        {
            found = true;
            semaphores[i].value+=1;
            if(semaphores[i].value<=0)
            {
                semaphores[i].processList[0].state = "READY"; //wakeup()
                semaphores[i].processList.splice(0,1);
            }
            break;
        }
    }
    if(found === false)
    {
        alert("could not find semaphore");
    }
}

function createDevice(device)
{
    var found = false;
    //loops to check if it already exists
    for(var i =0;i<devices.length;i++)
    {
        if(device === devices[i].name)
        {
            found = true;
            break;
        }
    }
    if(found === false)
        devices.push({"name":device, "processList":[]});
    else
        alert("device already exists");
}

function iowait(device)
{
    var found = false;
    boolean_is_io_called = true;
    for(var i =0;i<devices.length;i++)
    {
        if(device === devices[i].name)
        {
            found = true;
            devices[i].processList.push(currentlyExecutingProcess);
            currentlyExecutingProcess.state = "WAIT";
            currentlyExecutingProcess.nextCPUCycle = 0.5*currentlyExecutingProcess.lastCPUCycle + 0.5*currentlyExecutingProcess.nextCPUCycle;
            currentlyExecutingProcess.lastCPUCycle = 0;
            break;
        }
    }
    if(found === false)
    {
        alert("could not find device");
    }
}

function iosignal(device)
{
    var found = false;
    for(var i =0;i<devices.length;i++)
    {
        if(device === devices[i].name)
        {
            found = true;
            devices[i].processList[0].state = "READY";
            devices[i].processList.splice(0,1);
            break;
        }
    }
    if(found === false)
    {
        alert("could not find semaphore");
    }
}