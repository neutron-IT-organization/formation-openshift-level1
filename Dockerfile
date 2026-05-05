FROM quay.io/modh/odh-workbench-jupyter-minimal-cuda-py312-ubi9:rhoai-2.24-linux-x86-64

USER root

RUN dnf install -y \
    python3-tkinter \
    graphviz \
    graphviz-devel \
    python3.12-devel \
    pkgconf-pkg-config \
    cmake \
    git \
    gcc \
    gcc-c++ && \
    dnf clean all

COPY hailo_dataflow_compiler-5.3.0-py3-none-linux_x86_64.whl /tmp/

RUN pip install --no-cache-dir cmake && \
    pip install --no-cache-dir /tmp/hailo_dataflow_compiler-5.3.0-py3-none-linux_x86_64.whl && \
    pip install --no-cache-dir \
    tflite==2.18.0 \
    tensordict==0.9.0 \
    safetensors \
    xxhash==3.5.0 \
    verboselogs \
    onnxruntime==1.18.0 \
    torch==2.9.1 \
    torchvision==0.24.1 && \
    rm /tmp/hailo_dataflow_compiler-5.3.0-py3-none-linux_x86_64.whl

RUN fix-permissions /opt/app-root -P

USER 1000820000
