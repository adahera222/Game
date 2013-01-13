using UnityEngine;
using System.Collections;
using System;

/***************************************
 * Maps will use the following numbers
 * to represent various wall configurations:
 * 0  [None]     : Nothing in this Cell. Unreachable.
 * 1  [NSHall]   : Hallway running north and south
 * 2  [EWHall]   : Hallway running east and west
 * 3  [WWall]    : one wall to the west
 * 4  [SWall]    : one wall to the south
 * 5  [EWall]    : one wall to the east
 * 6  [NWall]    : one wall to the north
 * 7  [Empty]    : no walls
 * 8  [NDeadEnd] : walls east, west, and south. No north wall.
 * 9  [EDeadEnd] : walls west, north, and south. No east wall.
 * 10 [SDeadEnd] : walls west, north, and east. No south wall.
 * 11 [WDeadEnd] : walls north, south,and east. Now west wall.
 * 12 [NWCorner] : Corner with North and West Walls
 * 13 [NECorner] : Corner with North and East walls
 * 14 [SECorner] : Corner with East and South walls
 * 15 [SWCorner] : Corner with West and South walls
 ***************************************/
public enum CellType {None, NSHall, EWHall, WWall, SWall, EWall, NWall, Empty, NDeadEnd, EDeadEnd, SDeadEnd, WDeadEnd, NWCorner, NECorner, SECorner, SWCorner};

public static class CellHelper {
	private static CellType[] cellTypesWithNorthWalls = {CellType.EWHall, CellType.NWall, CellType.EDeadEnd, CellType.SDeadEnd, CellType.WDeadEnd, CellType.NWCorner, CellType.NECorner};
	private static CellType[] cellTypesWithEastWalls = {CellType.NSHall, CellType.EWall, CellType.NDeadEnd, CellType.SDeadEnd, CellType.WDeadEnd, CellType.NECorner, CellType.SECorner};
	private static CellType[] cellTypesWithSouthWalls = {CellType.EWHall, CellType.SWall, CellType.NDeadEnd, CellType.EDeadEnd, CellType.WDeadEnd, CellType.SECorner, CellType.SWCorner};
	private static CellType[] cellTypesWithWestWalls = {CellType.NSHall, CellType.WWall, CellType.NDeadEnd, CellType.EDeadEnd, CellType.SDeadEnd, CellType.NWCorner, CellType.SWCorner};
	
	public static bool HasNorthWall(CellType type) {
		return Array.IndexOf (cellTypesWithNorthWalls, type) > -1;
	}
	
	public static bool HasEastWall(CellType type) {
		return Array.IndexOf (cellTypesWithEastWalls, type) > -1;
	}
	
	public static bool HasSouthWall(CellType type) {
		return Array.IndexOf (cellTypesWithSouthWalls, type) > -1;
	}
	
	public static bool HasWestWall(CellType type) {
		return Array.IndexOf (cellTypesWithWestWalls, type) > -1;
	}
	
	public static void DetermineCellWalls(CellType type, out bool northWall, out bool eastWall, out bool southWall, out bool westWall) {
		northWall = HasNorthWall(type);
		eastWall = HasEastWall(type);
		southWall = HasSouthWall(type);
		westWall = HasWestWall(type);
	}
	
	/// <summary>
	/// Determines whether this cell type has a wall in the specified direction 
	/// </summary>
	/// <returns>
	/// <c>true</c> if this instance has a wall in the specified direction; otherwise, <c>false</c>.
	/// </returns>
	/// <param name='type'>
	/// The type of cell to check
	/// </param>
	/// <param name='direction'>
	/// The direction to check. Only supports North, South, East, and West
	/// </param>
	public static bool HasWallInDirection(CellType type, Direction direction) {
		bool hasWall = false;
		
		switch (direction) {
		case Direction.North :
			hasWall = HasNorthWall(type);
			break;
		case Direction.East :
			hasWall = HasEastWall (type);
			break;
		case Direction.South :
			hasWall = HasSouthWall (type);
			break;
		case Direction.West :
			hasWall = HasWestWall (type);
			break;
		}
		
		return hasWall;
	}
	
	/// <summary>
	/// Accepts a game object that should have a Cell script attached to it. If it does,
	/// it returns the type of cell stored in the script, otherwise it returns type None.
	/// </summary>
	/// <returns>
	/// The cell type.
	/// </returns>
	/// <param name='cellGameObject'>
	/// Cell game object.
	/// </param>
	public static CellType GetCellType(GameObject cellGameObject) {
		CellType cellType = CellType.None;
		if (cellGameObject != null )
		{
			Cell script = cellGameObject.GetComponent<Cell>();
			if (script != null) {
				cellType = script.type;
			}
		}
		return cellType;
	}
	
}
