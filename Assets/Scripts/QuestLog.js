#pragma strict
#pragma downcast
// pragma downcast just suppresses downcast warnings

import System.Collections.Generic; // import List type

var mainSkin: GUISkin; // new GUISkin set from editor
var bgQuestLog: Texture2D; // background for quest log
var aryQuests = new List.<clsQuest>(); // array holding all of the quests

var scrollPosition : Vector2; // The variable to control where the scrollview 'looks' into its child elements.

static var showQuestLog: boolean = false;

/*
	Used to clsQuest to define the individual steps that make up the quest.
*/
class clsQuestStep {
	var task: String; // description for the quest log
	var condition: String; // string describing conditions that must be met to complete the step
	var status: String; // indicates if the step is done with "incomplete" or "met"
};

class clsQuest {
	var questId: int;	// global quest id so outside stuff can find it
	var title : String; // quest title used in the quest log
	/* each step has a:
		task(string)	description shown to player
		condition(string) condition to be evaluated by EvaluateStatus ie inventory:red key, kill:boss, etc.
		status (done, working, complete)
	*/
	var arySteps = new List.<clsQuestStep>(); // makes a resizable List (its a typed array) of quest steps
	var currentStep : int = 0; // always start at the beginning - indicates earliest incomplete step
	var status : String = "incomplete"; // quest starts as incomplete, duh
   
	// constructor: var blah = new clsQuest("Title", arySteps);
	function clsQuest(newId: int, newTitle: String, aryNewSteps: Array) {
		this.questId = newId;
		this.title = newTitle;
		for (var newStep: clsQuestStep in aryNewSteps) {
			this.arySteps.Add(newStep);
		} // end for each (newStep: string in aryNewSteps)
		
		// when a quest is assigned, it should immediately be checked for completion, so if
		// they already killed the necessary monster, etc, bam, its done!
		this.EvaluateStatus();
	} // end function clsQuest(newId: int, newTitle: String, aryNewSteps: Array)
   
	/*
		retrieve the current step the user is on for this quest
	*/
	function GetCurrentStep() {
		return this.arySteps[this.currentStep];
	}
   
	/*
		Checks which steps are done and which are not. It also checks if the whole quest is done
	*/
	function EvaluateStatus() {
		// loop through each step
		var aryStepsIndex: int = 0;
		for (var step: clsQuestStep in arySteps) {
			var conditions: Array = ParseCondition(step.condition);
			var allConditionsMet: boolean = true;
			for (var condition: Array in conditions) {
				if (condition[0] == "inventory") {
					var scrInventory: InventoryManager = GameObject.Find("GameManager").GetComponent(InventoryManager);
//Debug.Log(condition);
//Debug.Log(scrInventory);
//Debug.Log(scrInventory.Inventory);
//Debug.Log(scrInventory.Inventory.aryInventory);
					if (!scrInventory.Inventory.aryInventory.Contains(condition[1]))
					{
						allConditionsMet = false;
					}
					
				} // end if (condition[0] == "inventory")
				else if (condition[0] == "click" && Input.GetKeyDown(KeyCode.Mouse0)) {
					// if the clicked item's scrQuestItem.itemName == condition[1], its ok
					var scrCharacterHandler: CharacterHandler = GameObject.Find("Character(Clone)").GetComponent("CharacterHandler");
					var tmpHit: RaycastHit = scrCharacterHandler.hit;
					var tmpQuestItem: QuestItem = tmpHit.transform.gameObject.GetComponent(QuestItem);
					// if the correct item was not clicked on, set to false
					if (condition[1] != tmpQuestItem.itemName) {
						allConditionsMet = false;
					}
				}
				else if (condition[0] == "steps") {
					var tmpSteps: String = condition[1] as String;
					var tmpPieces: String[] = tmpSteps.Split("-"[0]);
					// arySteps is 0-indexed, but quest info is 1-indexed
					for(var indStep:int = (parseInt(tmpPieces[0])-1);indStep <= (parseInt(tmpPieces[1])-1); indStep++) {
						// is step indStep status:met?
						var tmpStep = arySteps[indStep] as clsQuestStep;
						if (tmpStep.status != "met") {
							allConditionsMet = false;
						}
					}
					
				} // end else if (condition[0] == "steps")
				
			} // end for (condition: Array in conditions)

			// mark status appropriately
			if (allConditionsMet) {
				step.status = "met";
				arySteps[aryStepsIndex].status = "met";
			}
			aryStepsIndex++;
		} // end for (var step: clsQuestStep in arySteps)
		
		// update currentStep
		this.currentStep = 1;
		for (var step: clsQuestStep in arySteps) {
			if (step.status == "met")
				this.currentStep++;
			else
				break;
		} // end for (var step: clsQuestStep in arySteps)
		
		// if all steps of the quest are complete, and the quest itself hasn't been marked complete, do it
		// the check should probabaly be another function checks each step.status rather tahn currentStep
		if (this.currentStep > arySteps.Count && this.status != "complete")
		{
			this.status = "complete";
			Debug.Log("Quest Completed!!!!!!!!!!!!!!");
		}
	} // end function EvaluateStatus()
	
	/*
		Breaks the conditions string up into an array of conditions. Each of THOSE arrays
		has two values - trigger and details. Trigger/detail pairs are things like Trigger=click,
		detail=door which can then be evaluated to see if the door was clicked, or Trigger=steps, 
		detail=1-5 which can be evaluated to see if all steps 1-5 are completed yet.
	*/
	function ParseCondition(conditionString: String) {
		var aryConditions = new Array();
		var tmpArray = new Array();
		// first, split each condition up - there has to be at least one
		var conditions: Array = conditionString.Split(";"[0]);
		
		// now break each condition into a key/value pair ie: "inventory" & "key"
		for (var condition: String in conditions) {
			tmpArray = new Array();
			tmpArray = condition.Split(":"[0]);
			aryConditions.Add(tmpArray);
		}
		
		return aryConditions;
	} // end function ParseCondition(conditionString: String)
}; // end class clsQuest

function Start () {
	bgQuestLog = Resources.Load("QuestLogBG") as Texture2D;
	
	// is there a better way to do this? Maybe basically the same, but load from some db?
	LoadQuests();
} // end function Start ()

function OnGUI() {
	// set the skin to Necromancer. has to be done in OnGUI
	GUI.skin = mainSkin;
	
	if (showQuestLog) {
		// quest log
		GUILayout.BeginArea(Rect (0, 0, 300, 400), bgQuestLog);
		scrollPosition = GUILayout.BeginScrollView (scrollPosition, GUILayout.Width (290), GUILayout.Height (275));	
		GUILayout.Box("Quest Log");
		ShowQuests();
		GUILayout.EndScrollView();
		GUILayout.EndArea();
	}
} // end function OnGUI()

/*
	Builds the contents of the quest log from the aryQuests array.
*/
function ShowQuests() {
	// styling the skin
	var tmpDivider: GUIStyle = GUIStyle("Divider");
	tmpDivider.margin.left = 25;
	tmpDivider.margin.right = 25;
	var tmpTextArea: GUIStyle = GUIStyle("TextArea");
	
	var ind : int; // just used to keep track of which step we are currently working on printing

	// format the title
	var tmpTextField: GUIStyle = GUIStyle("TextField");
	tmpTextField.fontSize = 20;
	tmpTextField.normal.textColor = Color.black;
	tmpTextField.alignment = TextAnchor.UpperCenter;

	// actually building the log
	for (var tmpQuest : clsQuest in aryQuests)
	{
		GUILayout.TextField(tmpQuest.title, tmpTextField);
		ind = 1;
		for(var tmpStep: clsQuestStep in tmpQuest.arySteps)
		{
			// style completed steps
			if (ind < tmpQuest.currentStep)
			{
				tmpTextArea.padding.left = 25;
				tmpTextArea.padding.right = 25;
				tmpTextArea.normal.textColor = Color.gray;
				tmpTextArea.fontStyle = FontStyle.Normal;
			}
			// style current steps
			else if (ind == tmpQuest.currentStep)
			{
				tmpTextArea.padding.left = 8;
				tmpTextArea.padding.right = 8;
				tmpTextArea.normal.textColor = Color.blue;
				tmpTextArea.fontStyle = FontStyle.Bold;
			}
			// style step yet to be done
			else
			{
				tmpTextArea.padding.left = 8;
				tmpTextArea.padding.right = 8;
				tmpTextArea.normal.textColor = Color.black;
				tmpTextArea.fontStyle = FontStyle.Normal;
			}
			
			GUILayout.TextArea(tmpStep.task, tmpTextArea);
			ind++;
		} // end for(var tmpStep in tmpQuest.arySteps)
		GUILayout.Space(20);
		GUILayout.Label("", tmpDivider);
		GUILayout.Space(20);
	} // end for (var tmpQuest : clsQuest in aryQuests)
} // end function ShowQuests()

/*
	Builds the aryQuests array. Eventually, this will have to pull this info from some kind of database
	and be triggered so new quests can be assigned.
*/
function LoadQuests() {
	var aryLoadSteps = new Array();
	var newStep = new clsQuestStep();
	
// ==================================================================== First Quest
	newStep.task = "Step 1: Get Level 1 Key.";
	newStep.condition = "inventory:key1";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);
	
	newStep = new clsQuestStep();
	newStep.task = "Step 2: Use Level 1 Key on Portal 1.";
	newStep.condition = "steps:1-1;click:portal1";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);
	
	newStep = new clsQuestStep();
	newStep.task = "Step 3: Get Level 2 Key.";
	newStep.condition = "inventory:key2";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);
	
	newStep = new clsQuestStep();
	newStep.task = "Step 4: Use Level 2 Key on Portal 2.";
	newStep.condition = "steps:1-3;click:portal2";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);
	
	newStep = new clsQuestStep();
	newStep.task = "Step 5: Get Relic.";
	newStep.condition = "steps:1-4;click:relic";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);

	var loadQuest = new clsQuest(1, "First Quest", aryLoadSteps);
	loadQuest.EvaluateStatus();
	aryQuests.Add(loadQuest);
	



// ==================================================================== 300 Workout
	aryLoadSteps = new Array();
	newStep = new clsQuestStep();
	newStep.task = "Set 1: 50 pushups.";
	newStep.condition = "inventory:pushup(50)";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);
	
	newStep = new clsQuestStep();
	newStep.task = "Set 2: 50 jumping jacks.";
	newStep.condition = "inventory:jumpingjack(50)";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);
	
	newStep = new clsQuestStep();
	newStep.task = "Set 3: 50 deadlifts.";
	newStep.condition = "inventory:deadlift(50)";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);
	
	newStep = new clsQuestStep();
	newStep.task = "Set 4: 50 bench presses.";
	newStep.condition = "inventory:benchpress(50)";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);
	
	newStep = new clsQuestStep();
	newStep.task = "Set 5: 50 chinups.";
	newStep.condition = "inventory:chinup(50)";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);
	
	newStep = new clsQuestStep();
	newStep.task = "Set 6: 50 curls.";
	newStep.condition = "inventory:curl(50)";
	newStep.status = "incomplete";
	aryLoadSteps.Add(newStep);
	
	loadQuest = new clsQuest(2, "300 Workout", aryLoadSteps);
	loadQuest.EvaluateStatus();
	aryQuests.Add(loadQuest);
	
} // end function LoadQuests()

/*
	Called from outside this script, this function translates the passed-in quest id. If it finds a match,
	then it runs the clsQuest.EvaluateStatus function for that instance. Really, since I figured some stuff
	out, this function could go away and be replaced simply by its contents and the following Match... function
*/
public function EvaluateStatus(questId: int) {
	var ind: int = -1;
	ind = MatchQuestIdToArrayIndex(questId);
	
	if (ind >= 0)
	{
		aryQuests[ind].EvaluateStatus();
	}
} // end public function EvaluateStatus(questId: int)

/* 
	Called by public function EvaluateStatus(questId: int) int order to search the array of quests
	for questId and return aryQuests index. If it is NOT found, -1 is returned to indicate failure
*/
function MatchQuestIdToArrayIndex(questId: int) {
	var ind: int = 0;
	// convert the questId to the proper array index
	for (var quest: clsQuest in aryQuests) {
		if (quest.questId == questId)
		{
			return ind;
		}
		ind++;		
	}
	// if it couldn't find the questId, return failure
	return -1;
} // end function MatchQuestIdToArrayIndex(questId: int)