#!/bin/bash
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
