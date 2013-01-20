#pragma strict

/// <summary>
/// This script should be attached to every level cell GameObject
/// </summary>
public class Cell extends MonoBehaviour {

	public var type: CellType = CellType.None;
	public var start: boolean = false;
	
}