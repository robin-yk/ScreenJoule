// Illustrative open-cell foam texture shared by the 0D, 2D and 3D views.
// The solvers treat porosity as a homogenized body; these pores are drawn for
// recognition only and carry no geometric or numerical meaning.
function foamRandom(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
// Pores in a width × height box (any units): jittered grid, coverage grows with porosity.
function foamPores(width,height,porosity,poreSize,seed=7){
 const pores=[];if(!(porosity>0)||!(width>0)||!(height>0)||!(poreSize>0))return pores;
 const rand=foamRandom(seed),step=poreSize*1.15,cols=Math.ceil(width/step),rows=Math.ceil(height/step),keep=Math.min(.92,.35+porosity);
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const u=rand(),x=(i+.5+(rand()-.5)*.7)*step,y=(j+.5+(rand()-.5)*.7)*step,r=poreSize*(.28+.24*rand());if(u<keep&&x<width&&y<height)pores.push({x,y,r});}
 return pores;
}
const FOAM_STYLE={fill:'rgba(18,10,28,.42)',rim:'rgba(255,255,255,.28)',rimWidth:.8,note:'Pores are illustrative; the model treats the foam as a homogenized body'};
