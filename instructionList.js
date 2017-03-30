function executeInstruction(instruction)
{
    var params = instruction.split(" ");

    var functionName = params[0];
    //clears all spaces from the strings
    params.splice(0,1);

    for(var i =0;i<instructionList.length;i++)
    {
        if(functionName === instructionList[i].name)
        {
            var newFunc = new Function("parameters",instructionList[i].implementation);
            newFunc(params);
            break;
        }
    }
}

function populateInstructionList()
{
    document.getElementById('instructionList').options.length = 0;
    var sel = document.getElementById('instructionList');
    for(var i = 0; i < instructionList.length; i++) {
        var opt = document.createElement('option');
        opt.innerHTML = instructionList[i].name;
        opt.value = instructionList[i].name;
        sel.appendChild(opt);
    }
}

function displayInstructionImplementation()
{
    for(var i =0;i<instructionList.length;i++)
    {
        if(instructionList[i].name === document.getElementById("instructionList").value)
        {
            document.getElementById("instructionImplementation").value = instructionList[i].implementation;
            break;
        }
    }
}

function saveInstructionSet()
{
    for(var i =0;i<instructionList.length;i++)
    {
        if(instructionList[i].name === document.getElementById("instructionList").value)
        {
            instructionList[i].implementation = document.getElementById("instructionImplementation").value;
            break;
        }
    }
}

function saveSchedulingAlgorithm()
{
    configList.scheduler = document.getElementById("userCreated").value;
}

function createNewInstructionType()
{
    var selection = document.getElementById("instructionList").options;
    var name = prompt("Please enter instruction name", "");
    var cycles = prompt("Please enter number of cycles it takes", "");
    for(var i=0;i<selection.length;i++)
    {
        if(name === selection[i].value)
        {
            alert("Name already exists");
            return;
        }
    }
    if(name==="" || isNaN(cycles) || parseInt(cycles)<1)
    {
        alert("invalid instruction details");
        return;
    }

    var newInst = {"name":name,"implementation":"","cycles":parseInt(cycles)};
    instructionList.push(newInst);
    populateInstructionList();
    displayInstructionImplementation();
}
