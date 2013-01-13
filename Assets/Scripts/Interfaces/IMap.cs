using UnityEngine;
using System.Collections;

public interface IMap {
	INavigator Navigator { get; }
	int NumRows { get; }
	int NumCols { get; }
	GameObject this[int row, int col] { get; }
	void Generate();
	void Reset();
	CellType GetCellType(int row, int col);
	GameObject GetStartCell(out int startRow, out int startCol);
}
