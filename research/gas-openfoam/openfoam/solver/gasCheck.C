#include "fvCFD.H"
#include <fstream>
#include "mixedFvPatchFields.H"
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
for(label p : {inlet,outlet}){auto& bc=refCast<mixedFvPatchScalarField>(T.boundaryFieldRef()[p]);forAll(bc,f){label a=mesh.boundary()[p].faceCells()[f];bc.valueFraction()[f]=solid[a]?200/(200+20*mesh.deltaCoeffs().boundaryField()[p][f]):(p==inlet?1:0);}}
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
