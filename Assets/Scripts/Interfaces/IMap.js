#pragma strict

public interface IMap {
	function get NumRows(): int;
	function get Navigator(): INavigator;
	
	function get NumCols(): int;
	function Map(row: int, col: int): GameObject 
	function Generate();
	function Reset();
	function GetCellType(row: int, col: int): CellType;
	function GetStartCellIndex(): CellIndex;
	function PlaceItemInRandomRoom(item: Transform);
	function ValidMapCell(row: int, col: int): boolean
}