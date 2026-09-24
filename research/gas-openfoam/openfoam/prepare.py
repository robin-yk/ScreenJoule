from pathlib import Path
import json
b=Path(__file__).resolve().parent; src=b.parent
(b/'solver/Make/files').write_text('gasCheck.C\nEXE = $(FOAM_USER_APPBIN)/gasCheck\n')
(b/'solver/Make/options').write_text('EXE_INC = -I$(LIB_SRC)/finiteVolume/lnInclude -I$(LIB_SRC)/meshTools/lnInclude\nEXE_LIBS = -lfiniteVolume -lmeshTools\n')
(b/'solver/gasCheck.C').write_text(r'''#include "fvCFD.H"
#include <fstream>
#include <iomanip>
int main(int argc,char *argv[]){
#include "setRootCase.H"
#include "createTime.H"
#include "createMesh.H"
IOdictionary cfg(IOobject("gasProperties",runTime.constant(),mesh,IOobject::MUST_READ,IOobject::NO_WRITE));
scalar targetQ=readScalar(cfg.lookup("Q"));
volScalarField w(IOobject("w",runTime.timeName(),mesh,IOobject::MUST_READ,IOobject::AUTO_WRITE),mesh);
volScalarField T(IOobject("T",runTime.timeName(),mesh,IOobject::MUST_READ,IOobject::AUTO_WRITE),mesh);
labelList solids; DynamicList<label> sl;
scalarField solid(mesh.nCells(),0); forAll(solid,i){if(mag(mesh.C()[i].x())<.005-1e-10 && mag(mesh.C()[i].y())<.001-1e-10){solid[i]=1;sl.append(i);}} solids.transfer(sl);
surfaceScalarField mu(IOobject("mu",runTime.timeName(),mesh),mesh,dimensionedScalar("mu",dimensionSet(1,-1,-1,0,0,0,0),1.8e-5));
surfaceScalarField kf(IOobject("kf",runTime.timeName(),mesh),mesh,dimensionedScalar("k",dimensionSet(1,1,-3,-1,0,0,0),.026));
forAll(mesh.neighbour(),f){label a=mesh.owner()[f],b=mesh.neighbour()[f];mu[f]*=(solid[a]!=solid[b]?2:1);scalar ka=solid[a]?20:.026,kb=solid[b]?20:.026;kf[f]=2*ka*kb/(ka+kb);}
forAll(mesh.boundary(),p)forAll(mesh.boundary()[p],f){label a=mesh.boundary()[p].faceCells()[f];kf.boundaryFieldRef()[p][f]=solid[a]?20:.026;}
volScalarField force(IOobject("force",runTime.timeName(),mesh),mesh,dimensionedScalar("force",dimensionSet(1,-2,-2,0,0,0,0),25));
fvScalarMatrix weqn(-fvm::laplacian(mu,w)==force);weqn.setValues(solids,scalarField(solids.size(),0));weqn.solve();
label inlet=mesh.boundaryMesh().findPatchID("zmin"),outlet=mesh.boundaryMesh().findPatchID("zmax");
scalar unitQ=0;forAll(mesh.boundary()[outlet],f){label a=mesh.boundary()[outlet].faceCells()[f];unitQ+=w[a]*mesh.magSf().boundaryField()[outlet][f];}
scalar dp=targetQ/unitQ;w*=dp;w.correctBoundaryConditions();
surfaceScalarField phi(IOobject("phi",runTime.timeName(),mesh,IOobject::NO_READ,IOobject::AUTO_WRITE),mesh,dimensionedScalar("phi",dimensionSet(1,2,-3,-1,0,0,0),0));
forAll(mesh.neighbour(),f){label a=mesh.owner()[f],c=mesh.neighbour()[f];if(!solid[a]&&!solid[c])phi[f]=1206*.5*(w[a]+w[c])*mesh.Sf()[f].z();}
forAll(mesh.boundary(),p)forAll(mesh.boundary()[p],f){label a=mesh.boundary()[p].faceCells()[f];if(!solid[a])phi.boundaryFieldRef()[p][f]=1206*w[a]*mesh.Sf().boundaryField()[p][f].z();}
volScalarField heat(IOobject("heat",runTime.timeName(),mesh),mesh,dimensionedScalar("heat",dimensionSet(1,-1,-3,0,0,0,0),0));
scalar volume=0;forAll(solid,i)if(solid[i])volume+=mesh.V()[i];forAll(solid,i)if(solid[i])heat[i]=1/volume;
solve(fvm::div(phi,T)-fvm::laplacian(kf,T)==heat);
T.correctBoundaryConditions();
scalar wall=0,contact=0,incond=0,enthalpy=0;
forAll(mesh.boundary(),p)forAll(mesh.boundary()[p],f){label a=mesh.boundary()[p].faceCells()[f];scalar loss=kf.boundaryField()[p][f]*mesh.magSf().boundaryField()[p][f]*mesh.deltaCoeffs().boundaryField()[p][f]*(T[a]-T.boundaryField()[p][f]);if(solid[a])contact+=loss;else if(p==inlet)incond+=loss;else if(p!=outlet)wall+=loss;if(p==outlet)enthalpy+=phi.boundaryField()[p][f]*(T[a]-298.15);}
std::ofstream os((runTime.path()/"fields.json").c_str());os<<std::setprecision(17)<<"{\"dp\":"<<dp<<",\"budget\":{\"wall\":"<<wall<<",\"contact\":"<<contact<<",\"inletConduction\":"<<incond<<",\"enthalpy\":"<<enthalpy<<"},\"cells\":[";
forAll(solid,i){if(i)os<<",";os<<"["<<mesh.C()[i].x()<<","<<mesh.C()[i].y()<<","<<mesh.C()[i].z()<<","<<T[i]-273.15<<","<<w[i]<<","<<(1-(mesh.C()[i].z()+.02)/.04)*dp<<","<<solid[i]<<"]";}os<<"]}";
Info<<"pressureDrop "<<dp<<" thermalBalance "<<wall+contact+incond+enthalpy<<nl;runTime++;T.write();w.write();phi.write();return 0;
}
''')
rows=json.loads((src/'results.json').read_text())['rows']
for r in rows:
 nx,ny,nz=r['mesh']; case=b/'cases'/f"level{r['level']}-flow{r['flowRate']}"; (case/'0').mkdir(parents=True,exist_ok=True);(case/'constant').mkdir(exist_ok=True);(case/'system').mkdir(exist_ok=True)
 def head(cls,obj):return f'FoamFile {{version 2.0; format ascii; class {cls}; object {obj};}}\n'
 (case/'system/blockMeshDict').write_text(head('dictionary','blockMeshDict')+f'''convertToMeters 1; vertices ((-.01 -.003 -.02) (.01 -.003 -.02) (.01 .003 -.02) (-.01 .003 -.02) (-.01 -.003 .02) (.01 -.003 .02) (.01 .003 .02) (-.01 .003 .02)); blocks (hex (0 1 2 3 4 5 6 7) ({nx} {ny} {nz}) simpleGrading (1 1 1)); edges (); boundary (xmin {{type patch; faces ((0 4 7 3));}} xmax {{type patch; faces ((1 2 6 5));}} ymin {{type patch; faces ((0 1 5 4));}} ymax {{type patch; faces ((3 7 6 2));}} zmin {{type patch; faces ((0 3 2 1));}} zmax {{type patch; faces ((4 5 6 7));}}); mergePatchPairs ();''')
 (case/'constant/gasProperties').write_text(head('dictionary','gasProperties')+f"Q {r['flowRate']/6e7:.17g};\n")
 (case/'0/w').write_text(head('volScalarField','w')+'dimensions [0 1 -1 0 0 0 0]; internalField uniform 0; boundaryField { xmin {type fixedValue; value uniform 0;} xmax {type fixedValue; value uniform 0;} ymin {type fixedValue; value uniform 0;} ymax {type fixedValue; value uniform 0;} zmin {type zeroGradient;} zmax {type zeroGradient;} }')
 # Boundary mixed fractions set by face centre in solver later; start all generic mixed for ends.
 (case/'0/T').write_text(head('volScalarField','T')+'dimensions [0 0 0 1 0 0 0]; internalField uniform 298.15; boundaryField { xmin {type fixedValue; value uniform 298.15;} xmax {type fixedValue; value uniform 298.15;} ymin {type fixedValue; value uniform 298.15;} ymax {type fixedValue; value uniform 298.15;} zmin {type mixed; refValue uniform 298.15; refGradient uniform 0; valueFraction uniform 1; value uniform 298.15;} zmax {type mixed; refValue uniform 298.15; refGradient uniform 0; valueFraction uniform 0; value uniform 298.15;} }')
 (case/'system/controlDict').write_text(head('dictionary','controlDict')+'application gasCheck; startFrom startTime; startTime 0; stopAt endTime; endTime 1; deltaT 1; writeControl timeStep; writeInterval 1; writeFormat ascii; writePrecision 15; runTimeModifiable false;')
 (case/'system/fvSchemes').write_text(head('dictionary','fvSchemes')+'ddtSchemes {default steadyState;} gradSchemes {default Gauss linear;} divSchemes {default none; div(phi,T) Gauss upwind;} laplacianSchemes {default Gauss linear orthogonal;} interpolationSchemes {default linear;} snGradSchemes {default orthogonal;}')
 (case/'system/fvSolution').write_text(head('dictionary','fvSolution')+'solvers {w {solver PCG; preconditioner DIC; tolerance 1e-13; relTol 0; maxIter 20000;} T {solver PBiCGStab; preconditioner DILU; tolerance 1e-13; relTol 0; maxIter 30000;}}')
f=b/'solver/gasCheck.C';s=f.read_text().replace('#include <fstream>','#include <fstream>\n#include "mixedFvPatchFields.H"')
s=s.replace('scalar unitQ=0;', 'for(label p : {inlet,outlet}){auto& bc=refCast<mixedFvPatchScalarField>(T.boundaryFieldRef()[p]);forAll(bc,f){label a=mesh.boundary()[p].faceCells()[f];bc.valueFraction()[f]=solid[a]?200/(200+20*mesh.deltaCoeffs().boundaryField()[p][f]):(p==inlet?1:0);}}\nscalar unitQ=0;')
f.write_text(s)
(b/'run-openfoam.sh').write_text('''#!/bin/bash
source /usr/lib/openfoam/openfoam2512/etc/bashrc
set -e
export FOAM_USER_APPBIN=/work/bin
mkdir -p /work/bin
cd /work/solver
wmake > /work/build.log 2>&1
for case in /work/cases/*; do
 blockMesh -case "$case" > "$case/mesh.log" 2>&1
 checkMesh -case "$case" > "$case/mesh-check.log" 2>&1
 /work/bin/gasCheck -case "$case" > "$case/solver.log" 2>&1
 echo "Completed ${case##*/}"
done
''')
