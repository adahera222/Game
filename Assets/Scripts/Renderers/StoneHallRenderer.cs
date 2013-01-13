using UnityEngine;
using System.Collections;

public class StoneHallRenderer : ILevelRenderer {
	
	private const string TEXTURE_NAME = "Textures/StoneHall";
	
	private Texture2D textureAtlas;
	private float length = 1.0f;
	private Vector3[] cellVertices;
	private int[] cellTriangles;
	private Vector3[] cellNormals;
	private Vector2[] cellUVs;	
	private Material mat;
	
	public StoneHallRenderer() {
		//create the material that each cell will use
		mat = new Material(Shader.Find ("Diffuse"));
		mat.mainTexture = Resources.Load (TEXTURE_NAME) as Texture2D;
	}
	
	public void RenderMap(IMap map) {
		Vector3 startingPoint = Vector3.zero;
		int zOffset = 0;
		for (int row = 0; row < map.NumRows; row++) {
			zOffset = map.NumRows - (row + 1); //flips the dugeon map array row indexes to match the zero in the lower left corner of the grid system
			for (int col = 0; col < map.NumCols; col++) {
				if (map[row, col] != null) {
					
					//determine where this cell will be placed
					float x = startingPoint.x + (float)col * length * 2;
					float y = startingPoint.y;
					float z = startingPoint.z + zOffset * length * 2;
					
					Vector3 cellPosition = new Vector3(x, y, z);
					
					//figure out which walls this cell should have
					bool hasForwardWall;
					bool hasRightWall;
					bool hasBackwardWall;
					bool hasLeftWall;
					CellType cellType = map.GetCellType(row, col);
					CellHelper.DetermineCellWalls(cellType, out hasForwardWall, out hasRightWall, out hasBackwardWall, out hasLeftWall);
					
					//reposition this cell
					map[row, col].transform.position = cellPosition;
					map[row, col].transform.rotation = Quaternion.identity;
		
					//add the mesh components to the game object
					map[row, col].AddComponent<MeshRenderer>();
					MeshFilter mf = map[row, col].AddComponent<MeshFilter>();
					Mesh mesh = new Mesh();
					mf.mesh = mesh;

					//set material
					map[row, col].renderer.material = mat;
		
					//determine the number of sides
					int numSides = 2; //start with two; one for floor and one for ceiling
					numSides += hasForwardWall ? 1 : 0;
					numSides += hasRightWall ? 1 : 0;
					numSides += hasBackwardWall ? 1 : 0;
					numSides += hasLeftWall ? 1 : 0;
		
					//initialize all of the relevant arrays
					cellVertices = new Vector3[numSides * 4]; //four vertices per side
					cellTriangles = new int[numSides * 6]; //2 triangles per side, 3 vertices per triangle
					cellNormals = new Vector3[numSides * 4]; //one normal per vertex
					cellUVs = new Vector2[numSides * 4]; //one UV per vertex
		
					//these indexes will be used to track across arrays
					int verticeIndex = 0;
					int triangleIndex = 0;
		
					BuildCellSide(Direction.Down, map[row, col].transform, ref verticeIndex, ref triangleIndex); //floor
					BuildCellSide(Direction.Up, map[row, col].transform, ref verticeIndex, ref triangleIndex); //ceiling
					
					if (hasForwardWall) {
						BuildCellSide(Direction.Forward, map[row, col].transform, ref verticeIndex, ref triangleIndex); 
					}
					
					if (hasRightWall) {
						BuildCellSide(Direction.Right, map[row, col].transform, ref verticeIndex, ref triangleIndex); 
					}
					
					if (hasBackwardWall) {
						BuildCellSide(Direction.Backward, map[row, col].transform, ref verticeIndex, ref triangleIndex); 
					}
			
					if (hasLeftWall) {
						BuildCellSide(Direction.Left, map[row, col].transform, ref verticeIndex, ref triangleIndex); 
					}
			
					//assign all mesh arrays
					mesh.vertices = cellVertices;
					mesh.triangles = cellTriangles;
					mesh.normals = cellNormals;
					mesh.uv = cellUVs;		
					
				}
			}
		}		
	}
	
	/// <summary>
	/// This method assumes that every cell is a perfect square, centered on the position of the transform passed in,
	/// and is length*2 long. It can generate any one of the six sides of the cube at a distance of "length" from the center.
	/// </summary>
	/// <param name='direction'>
	/// Direction is an enum that indicates which side is to be built.
	/// </param>
	/// <param name='cell'>
	/// This transform must be positioned at what will be the center of the cell and facing forward. It is used to 
	/// determine the position of the sides vertices.
	/// </param>
	/// <param name='verticeIndex'>
	/// This indicates the index to begin storing vertices in the appropriate mesh arrays
	/// </param>
	/// <param name='trianglesIndex'>
	/// Similar to verticeIndex, this index tracks to the first empty spot in the mesh triangles array
	/// </param>
	private void BuildCellSide(Direction direction, Transform cell, ref int verticeIndex, ref int trianglesIndex) {
		//store this cell's starting vertex index
		int startVerticeIndex = verticeIndex;
		
		//the normal will be pretty much in the opposite direction as the "direction" normal
		Vector3 normalVector = Vector3.zero;
		
		//retrieve the three vectors required to the the upper left corner of the side that lies in "direction" from the cell's position.
		//scale each vector by length, which should give us a uniformly square cell, with a center at the cell's position.
		//It will take three vectors to determine each of the corner points. By starting in the upper left corner, we can quickly determine 
		//the positions of the other three vertices
		Vector3 directionVector = Vector3.zero;
		Vector3 translationVector1 = Vector3.zero;
		Vector3 translationVector2 = Vector3.zero;
		
		//in order to build the vertices clockwise, we will need three vectors which, when added together, form a corner of the vertice. Then,
		//when we begin determining the other vectors, we must select them such that you changing their signs in a specific pattern will select
		//them in clockwise order, assuming translationVector1 is "1" and translationVector2 is "2", the pattern for vertices is:
		// [1, 2] [1, -2] [-1, -2] [-1, 2]
		switch (direction) {
		case Direction.Up : 
			directionVector = cell.up * length; 
			translationVector1 = -cell.forward * length;
			translationVector2 = -cell.right * length;
			normalVector = -cell.up;
			break;
		case Direction.Down : 
			directionVector = -cell.up * length;
			translationVector1 = cell.forward * length;
			translationVector2 = -cell.right * length;
			normalVector = cell.up;
			break;
		case Direction.Right :
			directionVector = cell.right * length;
			translationVector1 = cell.up * length;
			translationVector2 = cell.forward * length;
			normalVector = -cell.right;
			break;
		case Direction.Left : 
			directionVector = -cell.right * length;
			translationVector1 = cell.up * length;
			translationVector2 = -cell.forward * length;
			normalVector = cell.right;
			break;
		case Direction.Forward : 
			directionVector = cell.forward * length;
			translationVector1 = cell.up * length;
			translationVector2 = -cell.right * length;
			normalVector = -cell.forward;
			break;
		case Direction.Backward :
			directionVector= -cell.forward * length;
			translationVector1 = cell.up * length;
			translationVector2 = cell.right * length;
			normalVector = cell.forward;
			break;
		}
		
		//Build the vertices by adding the vectors together in a way that will determine all four coners in clockwise order
		cellVertices[startVerticeIndex] = directionVector + translationVector1 + translationVector2;
		cellVertices[startVerticeIndex + 1] = directionVector + translationVector1 + -translationVector2;
		cellVertices[startVerticeIndex + 2] = directionVector + -translationVector1 + -translationVector2;
		cellVertices[startVerticeIndex + 3] = directionVector + -translationVector1 + translationVector2;
		
		//now build the triangles, from the vertices, that will form this side
		cellTriangles[trianglesIndex++] = startVerticeIndex;
		cellTriangles[trianglesIndex++] = startVerticeIndex + 1;
		cellTriangles[trianglesIndex++] = startVerticeIndex + 2;
		
		cellTriangles[trianglesIndex++] = startVerticeIndex;
		cellTriangles[trianglesIndex++] = startVerticeIndex + 2;
		cellTriangles[trianglesIndex++] = startVerticeIndex + 3;
		
		//apply normals
		cellNormals[startVerticeIndex] = normalVector;
		cellNormals[startVerticeIndex + 1] = normalVector;
		cellNormals[startVerticeIndex + 2] = normalVector;
		cellNormals[startVerticeIndex + 3] = normalVector;	
		
		//apply UVs
		if (direction == Direction.Down) {
			cellUVs[startVerticeIndex] = new Vector2(0.5f,1);
			cellUVs[startVerticeIndex + 1] = new Vector2(1,1);
			cellUVs[startVerticeIndex + 2] = new Vector2(1,0);
			cellUVs[startVerticeIndex + 3] = new Vector2(0.5f,0);
		} else {
			cellUVs[startVerticeIndex] = new Vector2(0,1);
			cellUVs[startVerticeIndex + 1] = new Vector2(0.5f,1);
			cellUVs[startVerticeIndex + 2] = new Vector2(0.5f,0);
			cellUVs[startVerticeIndex + 3] = new Vector2(0,0);			
		}
		
		//modify the vertex index to point to the next available index in the vertices array. The trianglesIndex was already adjusted
		//by using the ++ operator.
		verticeIndex += 4;
	}
	
}
