get_filename_component(name ${CMAKE_CURRENT_SOURCE_DIR} NAME)

if (USE_MPI)
  set(T t.${name})
  add_executable(${T} main.cpp)
  target_link_libraries(${T} aphros)
  add_test_current(COMMAND ./test main)
endif()

set(T t.${name}.manager)
add_executable(${T} manager.cpp)
target_link_libraries(${T} aphros)
if (USE_MPI)
  add_test_current(NAME manager COMMAND ./test manager)
else()
  add_test_current(NAME manager COMMAND ./test manager_seq)
endif()
