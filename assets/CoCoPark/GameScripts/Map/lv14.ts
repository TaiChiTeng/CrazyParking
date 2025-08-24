// 第5关地图数据和汽车数据
import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('Level14Map')
export class Level14Map {
    public static MapW: number = 5;
    public static MapH: number = 6;
    public static Map: number[][] = [
        [-3,-3, 0, 0, 0],
        [-3,-3, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ];

    // 汽车数据
    public static CarData: {outerMap: string, sort: number, type: number, inPark: number}[] = [
        {outerMap: 'U1', sort: 0, type: 4, inPark: 0},
        {outerMap: 'U2', sort: 0, type: 4, inPark: 0},
        {outerMap: 'L1', sort: 0, type: 4, inPark: 0},
        {outerMap: 'R2', sort: 0, type: 4, inPark: 0}
    ];
}